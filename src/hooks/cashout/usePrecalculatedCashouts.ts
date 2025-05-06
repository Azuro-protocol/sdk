import { type Selection, getProviderFromId, GraphBetStatus } from '@azuro-org/toolkit'
import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useChain } from '../../contexts/chain'
import { batchFetchCashouts } from '../../helpers/batchFetchCashouts'
import { type QueryParameter, type Bet } from '../../global'


export type PrecalculatedCashout = {
  isAvailable: boolean
  odds: string
} & Selection

export type PrecalculatedCashoutsQueryData = {
  margin: string,
  minMargin: string,
  cashouts: Record<string, PrecalculatedCashout>
} | undefined

type UsePrecalculatedCashoutsProps = {
  bet: Pick<Bet, 'tokenId' | 'amount' | 'outcomes' | 'status' | 'totalOdds'>
  query?: QueryParameter<PrecalculatedCashoutsQueryData>
}


const defaultData = {
  isAvailable: false,
  cashoutAmount: undefined,
}

export const usePrecalculatedCashouts = ({ bet, query = {} }: UsePrecalculatedCashoutsProps) => {
  const { tokenId, amount, outcomes, status, totalOdds } = bet

  const { appChain, api } = useChain()

  const conditionsKey = useMemo(() => {
    return outcomes.map(({ conditionId, outcomeId }) => `${conditionId}/${outcomeId}`).join('-')
  }, [ outcomes ])

  const isConditionsFromDifferentProviders = useMemo(() => {
    if (!conditionsKey) {
      return false
    }

    const providerIds = new Set(
      outcomes.map(({ conditionId }) => getProviderFromId(conditionId))
    )

    return providerIds.size > 1
  }, [ conditionsKey ])

  const formatData = useCallback((data: PrecalculatedCashoutsQueryData): { isAvailable: boolean, cashoutAmount: number | undefined } => {
    if (!data) {
      return defaultData
    }

    const { margin, minMargin, cashouts } = data

    const isAvailable = Object.values(cashouts).every(({ isAvailable }) => isAvailable)
    let cashoutAmount = +amount * +minMargin

    const isSameOdds = outcomes.every(({ conditionId, outcomeId, odds }) => {
      const key = `${conditionId}-${outcomeId}`

      return +cashouts[key]!.odds === odds
    })

    if (!isSameOdds) {
      const currentTotal = Object.values(cashouts).reduce((acc, { odds }) => acc + +odds, 0)

      cashoutAmount = +amount * (totalOdds / currentTotal) * +margin
    }

    return {
      isAvailable,
      cashoutAmount,
    }
  }, [ bet ])

  const { data, ...rest } = useQuery({
    queryKey: [ 'cashout/precalculate', api, tokenId ],
    queryFn: async () => {
      const data = await batchFetchCashouts(outcomes.map(({ conditionId }) => conditionId), appChain.id)

      if (!data) {
        return data
      }

      const cashouts = outcomes.reduce<Record<string, PrecalculatedCashout>>((acc, { conditionId, outcomeId }) => {
        const key = `${conditionId}-${outcomeId}`
        const cashout = data.cashouts[key]!

        acc[key] = cashout

        return acc
      }, {})

      return {
        ...data,
        cashouts,
      }
    },
    gcTime: 0, // disable cache
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    select: formatData,
    ...query,
    enabled: (
      query.enabled &&
      !isConditionsFromDifferentProviders &&
      Boolean(bet) &&
      status === GraphBetStatus.Accepted
    ),
  })

  return {
    data: data ?? defaultData,
    ...rest,
  }
}
