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
  const [ isFetching, setFetching ] = useState(!initialState)

  const isLocked = state !== ConditionState.Active

  useEffect(() => {
    if (!isSocketReady) {
      return
    }

    subscribeToUpdates([ conditionId ])

    return () => {
      unsubscribeToUpdates([ conditionId ])
    }
  }, [ isSocketReady, conditionId ])

  useEffect(() => {
    const unsubscribe = conditionWatcher.subscribe(`${conditionId}`, (data) => {
      const { state: newState } = data

      setState(newState)
    })

    return () => {
      unsubscribe()
    }
  }, [ conditionId ])

  useEffect(() => {
    if (initialState) {
      return
    }

    ;(async () => {
      const data = await batchFetchConditions([ conditionId ], graphql.feed)

      setState(data?.[conditionId]?.state || ConditionState.Active)
      setFetching(false)
    })()
  }, [ conditionId, graphql.feed ])

  return {
    data: state,
    isLocked,
    isFetching,
  }
}
