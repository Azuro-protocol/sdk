import { useEffect, useState } from 'react'
import { type Selection, ConditionState } from '@azuro-org/toolkit'

import { conditionWatcher } from '../../modules/conditionWatcher'
import { useChain } from '../../contexts/chain'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { batchFetchOutcomes } from '../../helpers/batchFetchOutcomes'


type Props = {
  selection: Selection
  initialOdds?: number
  initialState?: ConditionState
}

export const useSelection = ({ selection, initialOdds, initialState }: Props) => {
  const { conditionId, outcomeId } = selection

  const { graphql } = useChain()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()

  const [ odds, setOdds ] = useState(initialOdds || 0)
  const [ isOddsFetching, setOddsFetching ] = useState(!initialOdds)

  const [ state, setState ] = useState(initialState || ConditionState.Active)
  const [ isStateFetching, setStateFetching ] = useState(!initialState)

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
      const { outcomes, state: newState } = data

      const odds = outcomes[String(outcomeId)]!.odds

      setOdds(odds)
      setState(newState)
    })

    return () => {
      unsubscribe()
    }
  }, [ conditionId ])

  useEffect(() => {
    if (initialOdds && initialState) {
      return
    }

    ;(async () => {
      const key = `${conditionId}-${outcomeId}`
      const data = await batchFetchOutcomes([ conditionId ], graphql.feed)

      if (!initialOdds) {
        setOdds(data?.[key]?.odds || 0)
        setOddsFetching(false)
      }

      if (!initialState) {
        setState(data?.[key]?.state || ConditionState.Active)
        setStateFetching(false)
      }
    })()
  }, [ conditionId, graphql.feed ])

  return {
    data: {
      odds,
      state,
    },
    isLocked,
    isOddsFetching,
    isStateFetching,
  }
}
