import { useEffect, useState } from 'react'
import { useConfig } from 'wagmi'
import { type Selection, ConditionState } from '@azuro-org/toolkit'

import { oddsWatcher } from '../../modules/oddsWatcher'
import { useChain } from '../../contexts/chain'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { conditionStatusWatcher } from '../../modules/conditionStatusWatcher'
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
  const config = useConfig()

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
  }, [ isSocketReady ])

  useEffect(() => {
    const unsubscribe = oddsWatcher.subscribe(`${conditionId}`, (oddsData) => {
      const odds = oddsData.outcomes[String(outcomeId)]!.odds

      setOdds(odds)
    })

    return () => {
      unsubscribe()
    }
  }, [ config ])

  useEffect(() => {
    const unsubscribe = conditionStatusWatcher.subscribe(`${conditionId}`, (newState: ConditionState) => {
      setStateFetching(false)
      setState(newState)
    })

    return () => {
      unsubscribe()
    }
  }, [])

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
  }, [ graphql.feed ])

  return {
    odds,
    isLocked,
    isOddsFetching,
    isStateFetching,
  }
}
