import { useEffect, useState } from 'react'
import { OutcomeState } from '@azuro-org/toolkit'

import { outcomeWatcher } from '../../modules/outcomeWatcher'
import { useChain } from '../../contexts/chain'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'


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
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch-hooks/useOutcomeState
 *
 * @example
 * import { useOutcomeState } from '@azuro-org/sdk'
 * import { OutcomeState, type MarketOutcome } from '@azuro-org/toolkit'
 *
 * const { data: state, odds, turnover, isLocked, isHidden, isFetching } = useOutcomeState({
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

  const [ { state, isHidden, odds, turnover, isFetching }, setState ] = useState({
    state: initialState || OutcomeState.Active,
    isHidden: isInitiallyHidden,
    odds: initialOdds ?? 0,
    // turnover only arrives via live socket updates
    turnover: '',
    isFetching: !initialState && Boolean(conditionId) && Boolean(outcomeId),
  })

  const isLocked = state !== OutcomeState.Active

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
      setState((prevState) => ({
        state: data.state ?? prevState.state,
        isHidden: data.hidden ?? prevState.isHidden,
        odds: data.odds ?? prevState.odds,
        turnover: data.turnover ?? prevState?.turnover,
        isFetching: false
      }))
    })

    return () => {
      unsubscribe()
    }
  }, [ conditionId, outcomeId ])

  useEffect(() => {
    if (initialState || !conditionId || !outcomeId) {
      return
    }

    ;(async () => {
      const data = await batchFetchConditions([ conditionId ], appChain.id)
      const fetched = data?.[conditionId]?.outcomes?.[outcomeId]

      setState((prevState) => ({
        state: fetched?.state || prevState?.state || OutcomeState.Canceled,
        isHidden: fetched?.hidden ?? prevState?.isHidden,
        // REST odds are strings; coerce. turnover isn't returned by REST — keep last known.
        odds: +(fetched?.odds ?? prevState?.odds ?? 0),
        turnover: prevState?.turnover ?? '',
        isFetching: false,
      }))
    })()
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
