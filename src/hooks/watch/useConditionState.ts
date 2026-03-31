import { useEffect, useState } from 'react'
import { ConditionState } from '@azuro-org/toolkit'

import { conditionWatcher } from '../../modules/conditionWatcher'
import { useChain } from '../../contexts/chain'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'


export type UseConditionStateProps = {
  conditionId: string
  initialState?: ConditionState
  isInitiallyHidden?: boolean
}

/**
 * Watch real-time condition state updates for a single condition.
 * Subscribes to condition updates via websocket and tracks state changes (Active, Stopped, Resolved, etc.).
 * Requires `FeedSocketProvider` and `ConditionUpdatesProvider` (both are included in `AzuroSDKProvider`).
 *
 * Returns `isLocked` helper to check if the condition is not Active.
 * Returns `isHidden` helper to check if the condition may be hidden from the list of game markets.
 *
 * The `isHidden` field indicates whether a condition may be hidden from the game markets list.
 * It starts as `true` for stopped secondary conditions in `ConditionDetailedData`.
 * When a socket update arrives for a hidden condition, it is set back to `false` —
 * meaning the condition is still alive and was only temporarily stopped by the provider.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch/useConditionState
 *
 * @example
 * import { useConditionState } from '@azuro-org/sdk'
 * import { ConditionState, type ConditionDetailedData } from '@azuro-org/toolkit'
 *
 * const { data: state, isLocked, isFetching } = useConditionState({
 *   conditionId: condition.conditionId,
 *   initialState: condition.state, // ConditionState.Active, ConditionState.Stopped, etc.
 *   isInitiallyHidden: condition.hidden, // boolean, comes from API ConditionDetailedData['hidden']
 * })
 * */
export const useConditionState = ({ conditionId, initialState, isInitiallyHidden }: UseConditionStateProps) => {
  const { appChain } = useChain()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()

  const [ { state, isHidden, isFetching }, setState ] = useState({
    state: initialState || ConditionState.Active,
    isHidden: isInitiallyHidden,
    isFetching: !initialState && Boolean(conditionId),
  })

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

    const unsubscribe = conditionWatcher.subscribe(`${conditionId}`, (data) => {
      const { state: newState } = data

      // if condition got an update, then it isn't dead, mark it as visible (isHidden: false)
      setState({ state: newState, isHidden: false, isFetching: false })
    })

    return () => {
      unsubscribe()
    }
  }, [ conditionId ])

  useEffect(() => {
    if (initialState || !conditionId) {
      return
    }

    ;(async () => {
      const data = await batchFetchConditions([ conditionId ], appChain.id)

      setState((prevState) => ({
        state: data?.[conditionId]?.state || prevState?.state || ConditionState.Removed,
        isHidden: prevState?.isHidden,
        isFetching: false,
      }))
    })()
  }, [ conditionId, appChain.id, initialState ])

  return {
    data: state,
    isHidden,
    isLocked,
    isFetching,
  }
}
