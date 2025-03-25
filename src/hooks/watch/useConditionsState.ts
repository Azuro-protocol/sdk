import { useEffect, useMemo, useRef, useState } from 'react'
import { type ConditionState } from '@azuro-org/toolkit'

import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { conditionWatcher } from '../../modules/conditionWatcher'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'
import { useChain } from '../../contexts/chain'


type Props = {
  conditionIds: string[]
  initialStates?: Record<string, ConditionState>
}

export const useConditionsState = ({ conditionIds, initialStates }: Props) => {
  const { graphql } = useChain()
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
      const data = await batchFetchConditions(conditionIds, graphql.feed)

      const newStatuses = (conditionIds || []).reduce<Record<string, ConditionState>>((acc, conditionId) => {
        if (conditionId && data?.[conditionId]) {
          acc[conditionId] = data[conditionId].state
        }

        return acc
      }, {})

      setStatesFetching(false)
      setStates(newStatuses)
    })()
  }, [ conditionsKey ])

  return {
    states,
    isFetching: isStatesFetching,
  }
}
