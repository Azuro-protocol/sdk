import { useEffect, useState } from 'react'
import { ConditionState } from '@azuro-org/toolkit'

import { conditionWatcher } from '../../modules/conditionWatcher'
import { useChain } from '../../contexts/chain'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'
import { latchHidden } from '../../helpers/latchHidden'


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
 * It starts from what the feed reported at fetch time and is latched one way: an update reporting
 * `hidden: false` reveals the condition for good, and nothing hides it again. A market that stops
 * therefore stays in the list, locked, rather than disappearing and coming back as the provider
 * suspends and re-prices it. An update alone is not enough to reveal a condition - a market the
 * provider has parked keeps streaming odds for the rest of its life.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch/useConditionState
 *
 * @example
 * import { useConditionState } from '@azuro-org/sdk'
 * import { ConditionState, type ConditionDetailedData } from '@azuro-org/toolkit'
 *
 * const { data: state, isLocked, isFetching } = useConditionState({
 *   conditionId: condition.conditionId,
 *   initialState: condition.state, // ConditionState.Active or ConditionState.Stopped
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
      const { state: newState, hidden } = data

      setState((prevState) => ({
        state: newState,
        isHidden: latchHidden(prevState.isHidden, hidden),
        isFetching: false,
      }))
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
        // the condition isn't in the feed at all - treat it as not bettable rather than inventing
        // a settlement state it may not have
        state: data?.[conditionId]?.state || prevState?.state || ConditionState.Stopped,
        // a state refetch can't report visibility - the state endpoint carries no condition-level
        // `hidden` - so the last known value is carried forward
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
