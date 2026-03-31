import { useEffect, useMemo, useRef, useState } from 'react'
import { ConditionState, type ConditionDetailedData } from '@azuro-org/toolkit'

import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { conditionWatcher } from '../../modules/conditionWatcher'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'
import { useChain } from '../../contexts/chain'


export type UseConditionsStateProps = {
  conditionIds: string[]
  initialStates?: Record<string, ConditionState>
  conditions?: never
} | {
  conditions: Pick<ConditionDetailedData, 'conditionId' | 'state' | 'hidden'>[]
  initialStates?: never
  conditionIds?: never
}

export type ConditionsStateData = {
  states: Record<string, ConditionState>
  statesMap: Record<string, { state: ConditionState, hidden: boolean }>
}

/**
 * Watch real-time state updates for a list of conditions.
 * Subscribes to condition updates via websocket and tracks state changes (Active, Stopped, Resolved, etc.).
 * Requires `FeedSocketProvider` and `ConditionUpdatesProvider` (both are included in `AzuroSDKProvider`).
 *
 * Returns `data` - a map of condition IDs to their current state.
 * Returns `conditionsMap` - a map `{ [conditionId]: { state: ConditionState, hidden: boolean } }` of conditions.
 *
 * The `hidden` field indicates whether a condition may be hidden from the game markets list.
 * It starts as `true` for stopped secondary conditions in `ConditionDetailedData`.
 * When a socket update arrives for a hidden condition, it is set back to `false` —
 * meaning the condition is still alive and was only temporarily stopped by the provider.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch-hooks/useConditionsState
 *
 * @example
 * import { useConditionState } from '@azuro-org/sdk'
 * import { ConditionState, type ConditionDetailedData } from '@azuro-org/toolkit'
 *
 * // best approach for the list of game's markets
 * const { data, conditionsMap, isFetching } = useConditionState({
 *   // Pick<ConditionDetailedData, 'conditionId' | 'state' | 'hidden'>[]
 *   conditions,
 * })
 *
 * // OR if you have a condition ID list only, like in the betslip
 * const { data, conditionsMap, isFetching } = useConditionState({
 *   conditionIds: [ '123...', '456...' ],
 *   // optional, if not provided, it will fetch the initial states from the API
 *   initialStates: [ ConditionState.Active, ConditionState.Stopped ],
 * })
 * */
export const useConditionsState = ({ conditionIds: _conditionIds, initialStates, conditions }: UseConditionsStateProps) => {
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()
  const { appChain } = useChain()

  const { conditionIds, conditionsKey, initialState } = useMemo(() => {
    const empty = { conditionIds: [], conditionsKey: '', initialState: { states: {}, statesMap: {} } as ConditionsStateData }

    if (conditions) {
      return conditions.reduce<{ conditionIds: string[], conditionsKey: string, initialState: ConditionsStateData }>((acc, { conditionId, state, hidden }) => {
        acc.conditionIds.push(conditionId)
        acc.conditionsKey += conditionId
        acc.initialState.statesMap[conditionId] = { state, hidden: Boolean(hidden) }
        acc.initialState.states[conditionId] = state

        return acc
      }, empty)
    }

    if (_conditionIds) {
      return _conditionIds.reduce<{ conditionIds: string[], conditionsKey: string, initialState: ConditionsStateData }>((acc, conditionId) => {
        acc.conditionIds.push(conditionId)
        acc.conditionsKey += conditionId

        if (initialStates?.[conditionId]) {
          acc.initialState.statesMap[conditionId] = { state: initialStates[conditionId], hidden: false }
          acc.initialState.states[conditionId] = initialStates[conditionId]
        }

        return acc
      }, empty)
    }

    return empty
  }, [ _conditionIds, initialStates, conditions ])

  const [ state, setState ] = useState<ConditionsStateData>(initialState)
  const shouldFetchStates = useMemo(() => conditionIds.some((id) => !state?.states?.[id]), [ state, conditionIds ])

  const prevConditionsKeyRef = useRef(conditionsKey)

  if (conditionIds.length && conditionsKey !== prevConditionsKeyRef.current && state !== initialState) {
    // if conditions are changed, reset the state for the new conditions
    setState(initialState)
  }

  prevConditionsKeyRef.current = conditionsKey

  useEffect(() => {
    if (!isSocketReady || !conditionsKey.length) {
      return
    }

    subscribeToUpdates(conditionIds)

    return () => {
      unsubscribeToUpdates(conditionIds)
    }
  }, [ conditionsKey, isSocketReady ])

  useEffect(() => {
    if (!conditionIds.length) {
      return
    }

    const unsubscribeList = conditionIds.map((conditionId) => {
      return conditionWatcher.subscribe(conditionId, (data) => {
        const { state: newState } = data

        setState(prevData => {
          const newStates: ConditionsStateData = {
            states: {
              ...prevData.states,
              [conditionId]: newState,
            },
            statesMap: {
              ...prevData.statesMap,
              [conditionId]: {
                state: newState,
                // if condition got an update, then it isn't dead, mark it as visible
                hidden: false
              },
            },
          }

          return newStates
        })
      })
    })

    return () => {
      unsubscribeList.forEach((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [ conditionsKey ])

  useEffect(() => {
    if (!conditionIds.length || !shouldFetchStates) {
      return
    }

    ;(async () => {
      const data = await batchFetchConditions(conditionIds, appChain.id)

      setState((prevValue) => {
        return conditionIds.reduce<ConditionsStateData>((acc, conditionId) => {
          const hidden = prevValue.statesMap[conditionId]?.hidden ?? false
          const state = data?.[conditionId]?.state || prevValue.states[conditionId] || ConditionState.Removed

          acc.states[conditionId] = state
          acc.statesMap[conditionId] = {
            state,
            hidden,
          }

          return acc
        }, { states: { ...prevValue.states }, statesMap: { ...prevValue.statesMap } })
      })
    })()
  }, [ conditionsKey, appChain.id, shouldFetchStates ])

  return {
    data: state.states,
    conditionsMap: state.statesMap,
    isFetching: shouldFetchStates,
  }
}
