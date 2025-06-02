import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { type ChainId, getMaxBet, type Selection } from '@azuro-org/toolkit'
import { useEffect, useMemo } from 'react'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'
import { conditionWatcher } from '../../modules/conditionWatcher'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { formatToFixed } from '../../helpers/formatToFixed'


export type UseMaxBetProps = {
  selections: Selection[]
  chainId?: ChainId
  query?: QueryParameter<string>
}

export type UseMaxBet = (props: UseMaxBetProps) => UseQueryResult<string>

export const useMaxBet: UseMaxBet = (props) => {
  const { selections, chainId, query = {} } = props

  const { chain: appChain } = useOptionalChain(chainId)
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()

  const selectionsKey = useMemo(() => (
    selections.map(({ conditionId, outcomeId }) => `${conditionId}/${outcomeId}`).join('-')
  ), [ selections ])

  const queryData = useQuery({
    queryKey: [ 'max-bet', appChain.id, selectionsKey ],
    queryFn: async () => {

      const data = await getMaxBet({
        chainId: appChain.id,
        selections,
      })

      if (!data) {
        return '0'
      }

      return formatToFixed(data.maxBet, 3)
    },
    gcTime: 0, // disable cache
    refetchOnWindowFocus: false,
    enabled: Boolean(selections.length),
    ...query,
  })

  const { refetch } = queryData

  useEffect(() => {
    if (!isSocketReady || !selections?.length) {
      return
    }

    const conditionIds = selections.map(({ conditionId }) => conditionId)

    subscribeToUpdates(conditionIds)

    return () => {
      unsubscribeToUpdates(conditionIds)
    }
  }, [ selectionsKey, isSocketReady ])

  useEffect(() => {
    if (!selections?.length) {
      return
    }

    const unsubscribeList = selections.map(({ conditionId }) => {
      return conditionWatcher.subscribe(conditionId, () => refetch())
    })

    return () => {
      unsubscribeList.forEach((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [ selectionsKey ])

  return queryData
}
