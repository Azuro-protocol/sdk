import { useEffect, useMemo, useRef, useState } from 'react'
import { type ConditionState } from '@azuro-org/toolkit'

import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { conditionWatcher } from '../../modules/conditionWatcher'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'
import { useChain } from '../../contexts/chain'


export type UseConditionsStateProps = {
  conditionIds: string[]
  initialStates?: Record<string, ConditionState>
}

/**
 * Watch real-time state updates for a list of conditions.
 * Subscribes to condition updates via websocket and tracks state changes (Active, Stopped, Resolved, etc.).
 * Requires `FeedSocketProvider` and `ConditionUpdatesProvider` (both are included in `AzuroSDKProvider`).
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch-hooks/useConditionsState
 * */
export const useConditionsState = ({ conditionIds, initialStates }: UseConditionsStateProps) => {
  const { appChain } = useChain()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()

  const [ states, setStates ] = useState<Record<string, ConditionState>>(initialStates ?? {})

  const [ isStatesFetching, setStatesFetching ] = useState(!initialStates)

  const conditionsKey = useMemo(() => conditionIds.join('-'), [ conditionIds ])

  const prevConditionsKeyRef = useRef(conditionsKey)

  if (conditionIds.length && conditionsKey !== prevConditionsKeyRef.current) {
    setStatesFetching(true)
    setStates({})
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

        setStates(states => ({
          ...states,
          [conditionId]: newState,
        }))
      })
    })

    return () => {
      unsubscribeList.forEach((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [ conditionsKey ])

  useEffect(() => {
    if (!conditionIds.length || initialStates) {
      return
    }

    ;(async () => {
      const data = await batchFetchConditions(conditionIds, appChain.id)

      const newStatuses = (conditionIds || []).reduce<Record<string, ConditionState>>((acc, conditionId) => {
        if (conditionId && data?.[conditionId]) {
          acc[conditionId] = data[conditionId].state
        }

        return acc
      }, {})

      setStatesFetching(false)
      setStates(newStatuses)
    })()
  }, [ conditionsKey, appChain.id ])

  return {
    data: states,
    isFetching: isStatesFetching,
  }
}
