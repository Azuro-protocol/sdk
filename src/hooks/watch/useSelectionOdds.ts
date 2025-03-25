import { useEffect, useState } from 'react'
import { type Selection, ConditionState } from '@azuro-org/toolkit'

import { conditionWatcher } from '../../modules/conditionWatcher'
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
    const unsubscribe = conditionWatcher.subscribe(`${conditionId}`, (data) => {
      const { outcomes } = data

      const odds = outcomes[String(outcomeId)]?.odds

      if (odds) {
        setOdds(odds)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [ conditionId ])

  useEffect(() => {
    if (initialOdds) {
      return
    }

    ;(async () => {
      const data = await batchFetchConditions([ conditionId ], graphql.feed)

      setOdds(+(data?.[conditionId]?.outcomes?.[outcomeId]?.odds || 0))
      setFetching(false)
    })()
  }, [ conditionId, graphql.feed ])

  return {
    data: odds,
    isFetching,
  }
}
