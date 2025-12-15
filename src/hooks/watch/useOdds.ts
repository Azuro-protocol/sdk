import { useEffect, useMemo, useRef, useState } from 'react'
import { calcMindOdds, type Selection } from '@azuro-org/toolkit'

import { outcomeWatcher } from '../../modules/outcomeWatcher'
import { useChain } from '../../contexts/chain'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'
import { formatToFixed } from '../../helpers/formatToFixed'


export type UseOddsProps = {
  selections: Selection[]
}

export const useOdds = ({ selections }: UseOddsProps) => {
  const { graphql } = useChain()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()

  const [ odds, setOdds ] = useState<Record<string, number>>({})
  const [ isFetching, setFetching ] = useState(true)

  const { selectionsKey, conditionsKey } = useMemo(() => (
    selections?.reduce((acc, { conditionId, outcomeId }) => {
      acc.selectionsKey += acc.selectionsKey ? `-${conditionId}/${outcomeId}` : `${conditionId}/${outcomeId}`
      acc.conditionsKey += acc.conditionsKey ? `-${conditionId}` : `${conditionId}`

      return acc
    }, {
      selectionsKey: '',
      conditionsKey: '',
    })
  ), [ selections ])

  const prevSelectionsKeyRef = useRef(selectionsKey)

  if (selectionsKey !== prevSelectionsKeyRef.current) {
    setFetching(true)
    setOdds({})
  }

  prevSelectionsKeyRef.current = selectionsKey

  const totalOdds = useMemo(() => {
    return +formatToFixed(calcMindOdds({ odds: Object.values(odds), slippage: 0 }), 2)
  }, [ odds ])

  useEffect(() => {
    if (!isSocketReady) {
      return
    }

    const conditionIds = conditionsKey.split('-')

    subscribeToUpdates(conditionIds)

    return () => {
      unsubscribeToUpdates(conditionIds)
    }
  }, [ isSocketReady, conditionsKey ])

  useEffect(() => {
    const unsubscribeList = selections.map(({ conditionId, outcomeId }) => {
      return outcomeWatcher.subscribe(`${conditionId}-${outcomeId}`, (data) => {
        setOdds(prevOdds => ({
          ...prevOdds,
          [`${conditionId}-${outcomeId}`]: data.odds,
        }))
      })
    })

    return () => {
      unsubscribeList.forEach((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [ selectionsKey ])

  useEffect(() => {
    const conditionIds = conditionsKey?.split('-')

    if (!conditionIds.length) {
      return
    }

    ;(async () => {
      const data = await batchFetchConditions(conditionIds, graphql.feed)

      const newOdds = selections.reduce<Record<string, number>>((acc, { conditionId, outcomeId }) => {
        acc[`${conditionId}-${outcomeId}`] = +(data[conditionId]?.outcomes[outcomeId]?.odds || 1)

        return acc
      }, {})

      setOdds(newOdds)
      setFetching(false)
    })()
  }, [ selectionsKey, graphql.feed ])

  return {
    data: {
      odds,
      totalOdds,
    },
    isFetching,
  }
}
