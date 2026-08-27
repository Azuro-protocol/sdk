import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { OutcomeState, type ConditionState, type MarketOutcome, type Selection } from '@azuro-org/toolkit'

import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { outcomeWatcher } from '../../modules/outcomeWatcher'
import { applyOutcomeUpdate, type OutcomeStateData } from '../../helpers/applyOutcomeUpdate'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'
import { getShouldRefetchOutcomes } from '../../helpers/getShouldRefetchOutcomes'
import { latchHidden } from '../../helpers/latchHidden'
import { mergeWatchedStates } from '../../helpers/mergeWatchedStates'
import { useChain } from '../../contexts/chain'


export type UseOutcomesStateProps = {
  selections: Selection[]
  initialStates?: Record<string, OutcomeState>
  outcomes?: never
} | {
  outcomes: Pick<MarketOutcome, 'conditionId' | 'outcomeId' | 'odds' | 'state' | 'hidden'>[]
  initialStates?: never
  selections?: never
}

export type { OutcomeStateData }

export type OutcomesStateData = {
  states: Record<string, OutcomeState>
  /** map of `${conditionId}-${outcomeId}` to its current odds, turnover, state and hidden flag */
  statesMap: Record<string, OutcomeStateData>
}

const getKey = (conditionId: string, outcomeId: string) => `${conditionId}-${outcomeId}`

/**
 * Watch real-time state updates for a list of outcomes.
 * Subscribes to condition updates via websocket and tracks per-outcome state changes
 * (Active, Stopped, Canceled, Won, Lost) and visibility.
 * Requires `FeedSocketProvider` and `ConditionUpdatesProvider` (both are included in `AzuroSDKProvider`).
 *
 * This is the outcome-level analog of `useConditionsState`: a single condition can hold several outcomes
 * that independently become hidden or change state, so each outcome carries its own `state`/`hidden`.
 *
 * Returns `data` - a map of `${conditionId}-${outcomeId}` keys to their current `OutcomeState`.
 * Returns `outcomesMap` - a map `{ [`${conditionId}-${outcomeId}`]: { odds, turnover, state, hidden } }`
 * holding the live odds/turnover plus state/hidden for each outcome.
 *
 * `odds` and `turnover` are taken from every update. `state` and `hidden` are taken only from updates
 * whose condition is `Active`: an update for an inactive condition reports every one of its outcomes
 * as `Stopped`, so a settled outcome would blink back to unsettled each time its condition is
 * suspended. Such an update instead schedules a re-read from the state endpoint, which is
 * authoritative for per-outcome state.
 *
 * The `hidden` field indicates whether an outcome should be hidden from the market's outcome list,
 * independently of the condition's own `hidden` flag. It is latched one way: once an outcome has been
 * reported visible it stays visible, so an outcome doesn't flicker in and out as its condition is
 * suspended and re-priced.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch-hooks/useOutcomesState
 *
 * @example
 * import { useOutcomesState } from '@azuro-org/sdk'
 * import { OutcomeState, type MarketOutcome } from '@azuro-org/toolkit'
 *
 * // best approach for a condition's outcomes (MarketOutcome[] from groupConditionsByMarket)
 * const { data, outcomesMap, isFetching } = useOutcomesState({
 *   outcomes: condition.outcomes,
 * })
 *
 * // OR if you have selections only, like in the betslip
 * const { data, outcomesMap, isFetching } = useOutcomesState({
 *   selections: [ { conditionId: '123...', outcomeId: '1' } ],
 *   // optional, keyed by `${conditionId}-${outcomeId}`; fetched from the API when omitted
 *   initialStates: { '123...-1': OutcomeState.Active },
 * })
 * */
export const useOutcomesState = ({ selections, initialStates, outcomes }: UseOutcomesStateProps) => {
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()
  const { appChain } = useChain()

  const { selectionsList, conditionIds, selectionsKey, initialState } = useMemo(() => {
    const conditionIdsSet = new Set<string>()
    const selectionsList: { conditionId: string, outcomeId: string, key: string }[] = []
    const initialState: OutcomesStateData = { states: {}, statesMap: {} }
    let selectionsKey = ''

    const register = (conditionId: string, outcomeId: string) => {
      const key = getKey(conditionId, outcomeId)

      conditionIdsSet.add(conditionId)
      selectionsList.push({ conditionId, outcomeId, key })
      selectionsKey += key

      return key
    }

    if (outcomes) {
      outcomes.forEach(({ conditionId, outcomeId, odds, state, hidden }) => {
        const key = register(conditionId, outcomeId)

        // turnover only arrives via live socket updates — seed it empty
        initialState.statesMap[key] = { odds, turnover: '', state, hidden }
        initialState.states[key] = state
      })
    }
    else if (selections) {
      selections.forEach(({ conditionId, outcomeId }) => {
        const key = register(conditionId, outcomeId)

        if (initialStates?.[key]) {
          // visibility isn't part of `initialStates`, so it stays unreported rather than being
          // claimed visible - that would close the latch on a value nobody supplied
          initialState.statesMap[key] = { odds: 0, turnover: '', state: initialStates[key]! }
          initialState.states[key] = initialStates[key]!
        }
      })
    }

    return {
      selectionsList,
      conditionIds: Array.from(conditionIdsSet),
      selectionsKey,
      initialState,
    }
  }, [ selections, initialStates, outcomes ])

  const [ state, setState ] = useState<OutcomesStateData>(initialState)
  const shouldFetchStates = useMemo(
    () => selectionsList.some(({ key }) => !state?.states?.[key]),
    [ state, selectionsList ]
  )

  const prevSelectionsKeyRef = useRef(selectionsKey)
  const selectionsListRef = useRef(selectionsList)
  const isUnmountedRef = useRef(false)
  const prevConditionStatesRef = useRef<Record<string, ConditionState>>({})
  const refetchingConditionsRef = useRef(new Set<string>())

  if (selectionsKey !== prevSelectionsKeyRef.current) {
    // the watched selections changed (including cleared to empty): re-key onto the new set, keeping
    // what is already known for the outcomes that stayed. A reset would drop every latched reveal
    // and every settled outcome each time the feed adds a condition to a running game.
    setState((prevValue) => mergeWatchedStates(prevValue, initialState, selectionsList.map(({ key }) => key)))

    // the re-read trigger is keyed by conditionId - forget the conditions that are no longer
    // watched, so one that comes back is treated as newly seen and re-read again
    const watchedConditionIds = new Set(conditionIds)

    Object.keys(prevConditionStatesRef.current).forEach((conditionId) => {
      if (!watchedConditionIds.has(conditionId)) {
        delete prevConditionStatesRef.current[conditionId]
      }
    })
  }

  prevSelectionsKeyRef.current = selectionsKey
  selectionsListRef.current = selectionsList

  useEffect(() => {
    // reset on mount too - refs survive the mount/unmount/mount cycle React does in development
    isUnmountedRef.current = false
    refetchingConditionsRef.current.clear()

    return () => {
      isUnmountedRef.current = true
      refetchingConditionsRef.current.clear()
    }
  }, [])

  const fetchStates = useCallback(async (ids: string[]) => {
    const data = await batchFetchConditions(ids, appChain.id)

    if (isUnmountedRef.current) {
      return
    }

    const idsSet = new Set(ids)

    setState((prevValue) => {
      return selectionsListRef.current.reduce<OutcomesStateData>((acc, { conditionId, outcomeId, key }) => {
        if (!idsSet.has(conditionId)) {
          return acc
        }

        const fetched = data?.[conditionId]?.outcomes?.[outcomeId]
        const prev = prevValue.statesMap[key]
        // the outcome isn't in the feed at all. `Canceled` would be wrong here: it now means
        // the outcome was voided, which is a settlement with money attached
        const state = fetched?.state || prevValue.states[key] || OutcomeState.Stopped
        // the state endpoint is authoritative for per-outcome state, but visibility stays latched
        const hidden = latchHidden(prev?.hidden, fetched?.hidden)
        // REST odds are strings; coerce. turnover isn't returned by REST — keep last known.
        const odds = +(fetched?.odds ?? prev?.odds ?? 0)
        const turnover = prev?.turnover ?? ''

        acc.states[key] = state
        acc.statesMap[key] = {
          odds,
          turnover,
          state,
          hidden,
        }

        return acc
      }, { states: { ...prevValue.states }, statesMap: { ...prevValue.statesMap } })
    })
  }, [ appChain.id ])

  const refetchConditionOutcomes = useCallback((conditionId: string) => {
    if (refetchingConditionsRef.current.has(conditionId)) {
      return
    }

    refetchingConditionsRef.current.add(conditionId)

    // `batchFetchConditions` groups concurrent calls into one request, so several conditions going
    // inactive at once cost a single read
    fetchStates([ conditionId ])
      .catch(() => {
        // a failed read leaves the last known values in place; the next update retries
      })
      .finally(() => {
        refetchingConditionsRef.current.delete(conditionId)
      })
  }, [ fetchStates ])

  useEffect(() => {
    if (!isSocketReady || !selectionsKey.length) {
      return
    }

    subscribeToUpdates(conditionIds)

    return () => {
      unsubscribeToUpdates(conditionIds)
    }
  }, [ selectionsKey, isSocketReady ])

  useEffect(() => {
    if (!selectionsList.length) {
      return
    }

    const unsubscribeList = selectionsList.map(({ conditionId, key }) => {
      return outcomeWatcher.subscribe(key, (data) => {
        const { conditionState } = data

        setState(prevData => {
          const nextValue = applyOutcomeUpdate(prevData.statesMap[key], data)

          // nothing trustworthy to write yet - the re-read below fills it in
          if (!nextValue) {
            return prevData
          }

          return {
            states: {
              ...prevData.states,
              [key]: nextValue.state,
            },
            statesMap: {
              ...prevData.statesMap,
              [key]: nextValue,
            },
          }
        })

        const prevConditionState = prevConditionStatesRef.current[conditionId]

        prevConditionStatesRef.current[conditionId] = conditionState

        if (getShouldRefetchOutcomes(prevConditionState, conditionState)) {
          refetchConditionOutcomes(conditionId)
        }
      })
    })

    return () => {
      unsubscribeList.forEach((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [ selectionsKey, refetchConditionOutcomes ])

  useEffect(() => {
    if (!selectionsList.length || !shouldFetchStates) {
      return
    }

    fetchStates(conditionIds).catch(() => {
      // a failed read leaves the seeded values in place; the next update retries
    })
  }, [ selectionsKey, shouldFetchStates, fetchStates ])

  return {
    data: state.states,
    outcomesMap: state.statesMap,
    isFetching: shouldFetchStates,
  }
}
