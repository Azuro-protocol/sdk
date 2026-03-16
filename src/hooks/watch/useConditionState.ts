import { useEffect, useState } from 'react'
import { ConditionState } from '@azuro-org/toolkit'

import { conditionWatcher } from '../../modules/conditionWatcher'
import { useChain } from '../../contexts/chain'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'


export type UseConditionStateProps = {
  conditionId: string
  initialState?: ConditionState
}

/**
 * Watch real-time condition state updates for a single condition.
 * Subscribes to condition updates via websocket and tracks state changes (Active, Stopped, Resolved, etc.).
 * Requires `FeedSocketProvider` and `ConditionUpdatesProvider` (both are included in `AzuroSDKProvider`).
 *
 * Returns `isLocked` helper to check if the condition is not Active.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch/useConditionState
 *
 * @example
 * import { useConditionState } from '@azuro-org/sdk'
 *
 * const { data: state, isLocked, isFetching } = useConditionState({
 *   conditionId: condition.conditionId,
 *   initialState: condition.state
 * })
 * */
export const useConditionState = ({ conditionId, initialState }: UseConditionStateProps) => {
  const { appChain, graphql } = useChain()
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
      const data = await batchFetchConditions([ conditionId ], appChain.id)

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
