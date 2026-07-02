import { useEffect, useMemo, useRef, useState } from 'react'
import { OutcomeState, type MarketOutcome, type Selection } from '@azuro-org/toolkit'

import { useConditionUpdates, type OutcomeUpdateData } from '../../contexts/conditionUpdates'
import { outcomeWatcher } from '../../modules/outcomeWatcher'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'
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

export type OutcomesStateData = {
  states: Record<string, OutcomeState>
  /** map of `${conditionId}-${outcomeId}` to its current odds, turnover, state and hidden flag */
  statesMap: Record<string, OutcomeUpdateData>
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
 * holding the full `OutcomeUpdateData` for each outcome (live odds/turnover plus state/hidden).
 *
 * The `hidden` field indicates whether an outcome should be hidden from the market's outcome list,
 * independently of the condition's own `hidden` flag.
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
        initialState.statesMap[key] = { odds, turnover: '', state, hidden: Boolean(hidden) }
        initialState.states[key] = state
      })
    }
    else if (selections) {
      selections.forEach(({ conditionId, outcomeId }) => {
        const key = register(conditionId, outcomeId)

        if (initialStates?.[key]) {
          initialState.statesMap[key] = { odds: 0, turnover: '', state: initialStates[key]!, hidden: false }
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

  if (selectionsKey !== prevSelectionsKeyRef.current && state !== initialState) {
    // if selections are changed (including cleared to empty), reset the state for the new selections
    setState(initialState)
  }

  prevSelectionsKeyRef.current = selectionsKey

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

    const unsubscribeList = selectionsList.map(({ key }) => {
      return outcomeWatcher.subscribe(key, (data) => {
        setState(prevData => ({
          states: {
            ...prevData.states,
            [key]: data.state,
          },
          statesMap: {
            ...prevData.statesMap,
            // store the full OutcomeUpdateData (odds, turnover, state, hidden)
            [key]: {
              ...prevData.statesMap[key],
              ...data,
            },
          },
        }))
      })
    })

    return () => {
      unsubscribeList.forEach((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [ selectionsKey ])

  useEffect(() => {
    if (!selectionsList.length || !shouldFetchStates) {
      return
    }

    ;(async () => {
      const data = await batchFetchConditions(conditionIds, appChain.id)

      setState((prevValue) => {
        return selectionsList.reduce<OutcomesStateData>((acc, { conditionId, outcomeId, key }) => {
          const fetched = data?.[conditionId]?.outcomes?.[outcomeId]
          const prev = prevValue.statesMap[key]
          const state = fetched?.state || prevValue.states[key] || OutcomeState.Canceled
          const hidden = fetched?.hidden ?? prev?.hidden ?? false
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
    })()
  }, [ selectionsKey, appChain.id, shouldFetchStates ])

  return {
    data: state.states,
    outcomesMap: state.statesMap,
    isFetching: shouldFetchStates,
  }
}
