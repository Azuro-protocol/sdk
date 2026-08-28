import { useCallback, useEffect, useRef, useState } from 'react'
import { ConditionState, OutcomeState } from '@azuro-org/toolkit'

import { outcomeWatcher } from '../../modules/outcomeWatcher'
import { useChain } from '../../contexts/chain'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { applyOutcomeUpdate, type OutcomeStateData } from '../../helpers/applyOutcomeUpdate'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'
import { createStateReadQueue, type StateReadQueue } from '../../helpers/createStateReadQueue'
import { getShouldRefetchOutcomes } from '../../helpers/getShouldRefetchOutcomes'
import { latchHidden } from '../../helpers/latchHidden'


export type UseOutcomeStateProps = {
  conditionId: string
  outcomeId: string
  initialState?: OutcomeState
  isInitiallyHidden?: boolean
  initialOdds?: number
}

/**
 * Watch real-time state updates for a single outcome.
 * Subscribes to condition updates via websocket and tracks per-outcome state changes
 * (Active, Stopped, Canceled, Won, Lost) and visibility.
 * Requires `FeedSocketProvider` and `ConditionUpdatesProvider` (both are included in `AzuroSDKProvider`).
 *
 * This is the outcome-level analog of `useConditionState`: a single condition can hold several outcomes
 * that independently become hidden or change state, so each outcome carries its own `state`/`hidden`.
 *
 * Returns `isLocked` helper to check if the outcome is not Active.
 * Returns `isHidden` helper to check if the outcome should be hidden from the market's outcome list.
 * Returns the live `odds` and `turnover` for the outcome (from the same `outcomeWatcher` update).
 *
 * `odds` and `turnover` are taken from every update. `state` and `isHidden` are taken only from updates
 * whose condition is `Active`: an update for an inactive condition reports every one of its outcomes
 * as `Stopped`, so a settled outcome would blink back to unsettled each time its condition is
 * suspended. Such an update instead schedules a re-read from the state endpoint, which is
 * authoritative for per-outcome state.
 *
 * `isHidden` is latched one way: once the outcome has been reported visible it stays visible, so it
 * doesn't flicker in and out as its condition is suspended and re-priced.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch-hooks/useOutcomeState
 *
 * @example
 * import { useOutcomeState } from '@azuro-org/sdk'
 * import { OutcomeState, type MarketOutcome } from '@azuro-org/toolkit'
 *
 * const { state, odds, turnover, isLocked, isHidden, isFetching } = useOutcomeState({
 *   conditionId: outcome.conditionId,
 *   outcomeId: outcome.outcomeId,
 *   initialState: outcome.state, // OutcomeState.Active, OutcomeState.Stopped, etc.
 *   isInitiallyHidden: outcome.hidden, // boolean, comes from MarketOutcome['hidden']
 *   initialOdds: outcome.odds, // number, comes from MarketOutcome['odds']
 * })
 * */
export const useOutcomeState = ({ conditionId, outcomeId, initialState, isInitiallyHidden, initialOdds }: UseOutcomeStateProps) => {
  const { appChain } = useChain()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()

  const getSeedState = () => ({
    state: initialState || OutcomeState.Active,
    isHidden: isInitiallyHidden,
    odds: initialOdds ?? 0,
    // turnover only arrives via live socket updates
    turnover: '',
    isFetching: !initialState && Boolean(conditionId) && Boolean(outcomeId),
  })

  const [ { state, isHidden, odds, turnover, isFetching }, setState ] = useState(getSeedState)

  const isLocked = state !== OutcomeState.Active

  const isUnmountedRef = useRef(false)
  const prevConditionStateRef = useRef<ConditionState | undefined>(undefined)
  const readQueueRef = useRef<StateReadQueue | undefined>(undefined)

  if (!readQueueRef.current) {
    readQueueRef.current = createStateReadQueue()
  }

  const outcomeKey = `${conditionId}-${outcomeId}`
  const outcomeKeyRef = useRef(outcomeKey)

  if (outcomeKey !== outcomeKeyRef.current) {
    // the hook was pointed at a different outcome. `useState`'s value seeds the mount only, so
    // without re-seeding here a reused component instance keeps rendering the previous outcome's
    // state and visibility: the repair read below is skipped whenever an initial state was passed,
    // and an update whose condition repeats the previous condition's state writes neither field
    // and asks for no re-read.
    setState(getSeedState())

    // both guards are keyed to the outcome that has gone - the first message about the new one has
    // to count as newly seen, and the read in flight for the old one no longer blocks anything
    prevConditionStateRef.current = undefined
    readQueueRef.current!.clear()
  }

  outcomeKeyRef.current = outcomeKey

  useEffect(() => {
    // reset on mount too - refs survive the mount/unmount/mount cycle React does in development
    isUnmountedRef.current = false
    readQueueRef.current!.clear()

    return () => {
      isUnmountedRef.current = true
      readQueueRef.current!.clear()
    }
  }, [])

  const fetchState = useCallback(async () => {
    const data = await batchFetchConditions([ conditionId ], appChain.id)
    const fetched = data?.[conditionId]?.outcomes?.[outcomeId]

    // the hook may have been pointed at another outcome while the read was in flight - what came
    // back describes the outcome that has gone
    if (isUnmountedRef.current || outcomeKeyRef.current !== `${conditionId}-${outcomeId}`) {
      return
    }

    setState((prevState) => ({
      ...prevState,
      // the outcome isn't in the feed at all. `Canceled` would be wrong here: it now means the
      // outcome was voided, which is a settlement with money attached
      state: fetched?.state || prevState?.state || OutcomeState.Stopped,
      // the state endpoint is authoritative for per-outcome state, but visibility stays latched
      isHidden: latchHidden(prevState?.isHidden, fetched?.hidden),
      // REST odds are strings; coerce. turnover isn't returned by REST — keep last known.
      odds: +(fetched?.odds ?? prevState?.odds ?? 0),
      isFetching: false,
    }))
  }, [ conditionId, outcomeId, appChain.id ])

  const refetchState = useCallback(() => {
    // the queue re-issues this request when a read already in flight settles, rather than dropping
    // it: that read was issued before this update and cannot carry what it reports, and nothing
    // guarantees the condition will report again
    readQueueRef.current!.request([ conditionId ], fetchState)
  }, [ conditionId, fetchState ])

  useEffect(() => {
    if (!isSocketReady || !conditionId) {
      return
    }

    subscribeToUpdates([ conditionId ])

    return () => {
      unsubscribeToUpdates([ conditionId ])
    }
  }, [ isSocketReady, conditionId ])

  useEffect(() => {
    if (!conditionId || !outcomeId) {
      return
    }

    const unsubscribe = outcomeWatcher.subscribe(`${conditionId}-${outcomeId}`, (data) => {
      const { conditionState } = data
      const isConditionActive = conditionState === ConditionState.Active

      setState((prevState) => {
        const prevValue: OutcomeStateData = {
          odds: prevState.odds,
          turnover: prevState.turnover,
          state: prevState.state,
          hidden: prevState.isHidden,
        }
        // there is always a previous value here, so the update always folds into something
        const nextValue = applyOutcomeUpdate(prevValue, data) ?? prevValue

        return {
          state: nextValue.state,
          odds: nextValue.odds,
          turnover: nextValue.turnover,
          isHidden: nextValue.hidden,
          // an inactive condition leaves state and visibility to the re-read below
          isFetching: isConditionActive ? false : prevState.isFetching,
        }
      })

      const prevConditionState = prevConditionStateRef.current

      prevConditionStateRef.current = conditionState

      if (getShouldRefetchOutcomes(prevConditionState, conditionState)) {
        refetchState()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [ conditionId, outcomeId, refetchState ])

  useEffect(() => {
    if (initialState || !conditionId || !outcomeId) {
      return
    }

    refetchState()
  }, [ conditionId, outcomeId, appChain.id, initialState ])

  return {
    state,
    odds,
    turnover,
    isHidden,
    isLocked,
    isFetching,
  }
}
