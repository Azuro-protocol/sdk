import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { type ChainId, getBetCalculation, type Selection } from '@azuro-org/toolkit'
import { useEffect, useMemo } from 'react'
import { type Address } from 'viem'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'
import { conditionWatcher } from '../../modules/conditionWatcher'
import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { formatToFixed } from '../../helpers/formatToFixed'


type BetCalculation = {
  minBet: string | undefined
  maxBet: string
}

export type UseBetCalculationProps = {
  selections: Selection[]
  chainId?: ChainId
  account: Address | undefined
  query?: QueryParameter<BetCalculation>
}

/**
 * Calculates the minimum and maximum bet amount for given selections.
 * User's account is required to provide the **correct** maximum bet amount.
 *
 * Used in betslip provider (`useDetailedBetslip` hook)
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useBetCalculation
 *
 * @example <caption>Basic usage</caption>
 * import { useBetCalculation } from '@azuro-org/sdk'
 *
 * const { data, isFetching } = useBetCalculation({ selections, account })
 * const { minBet, maxBet } = data || {}
 *
 * @example <caption>Get the same from `useDetailedBetslip` (`BetslipProvider`) for selections in betslip</caption>
 * import { useDetailedBetslip } from '@azuro-org/sdk'
 *
 * const { minBet, maxBet, isBetCalculationFetching } = useDetailedBetslip()
 * */
export const useBetCalculation = (props: UseBetCalculationProps): UseQueryResult<BetCalculation> => {
  const { selections, chainId, account, query = {} } = props

  const { chain: appChain, betToken } = useOptionalChain(chainId)
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()

  const selectionsKey = useMemo(() => (
    selections.map(({ conditionId, outcomeId }) => `${conditionId}/${outcomeId}`).join('-')
  ), [ selections ])

  const queryData = useQuery({
    queryKey: [ 'bet-calc', appChain.id, account, selectionsKey ],
    queryFn: async () => {
      const data = await getBetCalculation({
        chainId: appChain.id,
        selections,
        account,
      })

      let result: BetCalculation = {
        minBet: undefined,
        maxBet: '0'
      }

      if (typeof data?.minBet !== 'undefined') {
        result.minBet = formatToFixed(data.minBet, betToken.decimals)
      }

      if (data?.maxBet) {
        result.maxBet = formatToFixed(data!.maxBet, betToken.decimals)
      }

      return result
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
