import { useEffect, useState } from 'react'
import { type Selection } from '@azuro-org/toolkit'

import { outcomeWatcher } from '../../modules/outcomeWatcher'
import { useChain } from '../../contexts/chain'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'


type Props = {
  selection: Selection
  initialOdds?: number
}

export const useSelectionOdds = ({ selection, initialOdds }: Props) => {
  const { conditionId, outcomeId } = selection

  const { graphql } = useChain()
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
      setOdds( data.odds)
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
      const data = await batchFetchConditions([ conditionId ], graphql.feed)

      setOdds(+(data?.[conditionId]?.outcomes?.[outcomeId]?.odds || 0))
      setFetching(false)
    })()
  }, [ conditionId, outcomeId, graphql.feed ])

  return {
    data: odds,
    isFetching,
  }
}
