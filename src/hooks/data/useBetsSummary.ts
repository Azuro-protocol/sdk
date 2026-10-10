import { useCallback } from 'react'
import { formatUnits } from 'viem'
import {
  type BettorFragment, type BettorsQuery, type BettorsQueryVariables, type ChainId, BettorsDocument,
} from '@azuro-org/toolkit'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type BetsSummary, type QueryParameter } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'
import { betsQueryKeys } from '../../helpers/betsQueryKeys'


type BettorAmountField = Extract<keyof BettorFragment, `raw${string}`>
type BettorCountField = Extract<keyof BettorFragment, `${string}Count`>

export type UseBetsSummaryProps = {
  account: string
  chainId?: ChainId
  affiliates?: string[]
  query?: QueryParameter<BettorsQuery['bettors']>
}

export type UseBetsSummary = (props: UseBetsSummaryProps) => UseQueryResult<BetsSummary>

/**
 * Get betting summary statistics for a given account, summed over every pool and affiliate the
 * bets subgraph keeps a row for (or over the given `affiliates` only).
 *
 * The top-level figures cover bets placed with the account's own funds: a freebet is counted only in
 * `freebet`, whose payouts are the bettor's share. `withdrawable` is what the account can redeem now,
 * `toPayout` plus `freebet.toPayout`.
 *
 * It needs a bets subgraph that serves the freebet fields of `Bettor`; on a deployment that predates
 * them the query fails.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useBetsSummary
 *
 * @example
 * import { useBetsSummary } from '@azuro-org/sdk'
 *
 * const { data, isFetching } = useBetsSummary({ account: '0x...' })
 * const { toPayout, inBets, totalPayout, totalProfit, betsCount, withdrawable, freebet } = data || {}
 * const { betsCount: freebetsCount, toPayout: freebetToPayout } = freebet || {}
 * */
export const useBetsSummary: UseBetsSummary = (props) => {
  const { account, affiliates, chainId, query = {} } = props

  const { betToken, graphql } = useOptionalChain(chainId)

  const gqlLink = graphql.bets

  const formatData = useCallback((rows: BettorsQuery['bettors']): BetsSummary => {
    const sumAmount = (field: BettorAmountField) => rows.reduce((acc, row) => acc + BigInt(row[field]), 0n)
    const sumCount = (field: BettorCountField) => rows.reduce((acc, row) => acc + row[field], 0)
    const format = (value: bigint) => formatUnits(value, betToken.decimals)

    const rawToPayout = sumAmount('rawToPayout')
    const rawFreebetToPayout = sumAmount('rawFreebetToPayout')

    return {
      toPayout: format(rawToPayout),
      inBets: format(sumAmount('rawInBets')),
      totalPayout: format(sumAmount('rawTotalPayout')),
      totalProfit: format(sumAmount('rawTotalProfit')),
      betsCount: sumCount('betsCount'),
      wonBetsCount: sumCount('wonBetsCount'),
      lostBetsCount: sumCount('lostBetsCount'),
      canceledBetsCount: sumCount('canceledBetsCount'),
      cashedOutBetsCount: sumCount('cashedOutBetsCount'),
      withdrawable: format(rawToPayout + rawFreebetToPayout),
      freebet: {
        betsCount: sumCount('freebetBetsCount'),
        wonBetsCount: sumCount('freebetWonBetsCount'),
        lostBetsCount: sumCount('freebetLostBetsCount'),
        canceledBetsCount: sumCount('freebetCanceledBetsCount'),
        turnover: format(sumAmount('rawFreebetTurnover')),
        inBets: format(sumAmount('rawFreebetInBets')),
        toPayout: format(rawFreebetToPayout),
        totalPayout: format(sumAmount('rawFreebetTotalPayout')),
      },
    }
  }, [ betToken.decimals ])

  return useQuery({
    queryKey: betsQueryKeys.summary({ gqlLink, account, affiliates }),
    queryFn: async () => {
      const variables: BettorsQueryVariables = {
        where: {
          address: account?.toLowerCase(),
        },
      }

      if (affiliates?.length) {
        variables.where.affiliate_in = affiliates.map(affiliate => affiliate.toLowerCase())
      }

      const { bettors } = await gqlRequest<BettorsQuery, BettorsQueryVariables>({
        url: gqlLink,
        document: BettorsDocument,
        variables,
      })

      return bettors
    },
    select: formatData,
    refetchOnWindowFocus: false,
    staleTime: 5000,
    ...query,
  })
}
