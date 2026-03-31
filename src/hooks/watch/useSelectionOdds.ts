import { useEffect, useState } from 'react'
import { type Selection } from '@azuro-org/toolkit'

import { outcomeWatcher } from '../../modules/outcomeWatcher'
import { useChain } from '../../contexts/chain'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'


export type UseSelectionOddsProps = {
  selection: Selection
  initialOdds?: number
}

/**
 * Watch real-time odds updates for a single selection.
 * Subscribes to condition updates via websocket and tracks odds changes.
 *
 * Optionally accepts `initialOdds` to skip initial fetch if odds are already known.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch/useSelectionOdds
 *
 * @example
 * import { useSelectionOdds } from '@azuro-org/sdk'
 *
 * const { data: odds, isFetching } = useSelectionOdds({
 *   selection: { conditionId: '123', outcomeId: '1' },
 *   initialOdds: 1.5
 * })
 * */
export const useSelectionOdds = ({ selection, initialOdds }: UseSelectionOddsProps) => {
  const { conditionId, outcomeId } = selection

  const { appChain } = useChain()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()

  const [ odds, setOdds ] = useState(initialOdds || 0)
  const [ isFetching, setFetching ] = useState(!initialOdds)

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
    const unsubscribe = outcomeWatcher.subscribe(`${conditionId}-${outcomeId}`, (data) => {
      setOdds(data.odds)
    })

    return () => {
      unsubscribe()
    }
  }, [ conditionId, outcomeId ])

  useEffect(() => {
    if (initialOdds) {
      return
    }

    ;(async () => {
      const data = await batchFetchConditions([ conditionId ], appChain.id)

      setOdds(+(data?.[conditionId]?.outcomes?.[outcomeId]?.odds || 0))
      setFetching(false)
    })()
  }, [ conditionId, outcomeId, appChain.id ])

  return {
    data: odds,
    isFetching,
  }
}
