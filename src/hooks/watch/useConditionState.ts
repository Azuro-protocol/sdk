import { useEffect, useState } from 'react'
import { ConditionState } from '@azuro-org/toolkit'

import { conditionWatcher } from '../../modules/conditionWatcher'
import { useChain } from '../../contexts/chain'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'


type Props = {
  conditionId: string
  initialState?: ConditionState
}

export const useConditionState = ({ conditionId, initialState }: Props) => {
  const { graphql } = useChain()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()

  const [ state, setState ] = useState(initialState || ConditionState.Active)
  const [ isFetching, setFetching ] = useState(!initialState && Boolean(conditionId))

  const isLocked = state !== ConditionState.Active

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
    if (!conditionId) {
      return
    }

    setState(initialState || ConditionState.Active)
    const unsubscribe = conditionWatcher.subscribe(`${conditionId}`, (data) => {
      const { state: newState } = data

      setState(newState)
    })

    return () => {
      unsubscribe()
    }
  }, [ conditionId ])

  useEffect(() => {
    if (initialState || !conditionId) {
      return
    }

    setFetching(true)

    ;(async () => {
      const data = await batchFetchConditions([ conditionId ], graphql.feed)

      setState(data?.[conditionId]?.state || ConditionState.Active)
      setFetching(false)
    })()
  }, [ conditionId, graphql.feed, initialState ])

  return {
    data: state,
    isLocked,
    isFetching,
  }
}
