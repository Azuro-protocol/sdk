import { useCallback } from 'react'
import { formatUnits } from 'viem'
import { type BettorsQuery, type BettorsQueryVariables, type ChainId, BettorsDocument } from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


type Props = {
  account: string
  chainId?: ChainId
  affiliates?: string[]
  query?: QueryParameter<BettorsQuery['bettors']>
}

export const useBetsSummary = (props: Props) => {
  const { account, affiliates, chainId, query = {} } = props

  const { betToken, graphql } = useOptionalChain(chainId)

  const gqlLink = graphql.bets

  const formatData = useCallback((data: BettorsQuery['bettors']) => {
    if (!data?.length) {
      return {
        toPayout: '0',
        inBets: '0',
        totalPayout: '0',
        totalProfit: '0',
        betsCount: 0,
        wonBetsCount: 0,
        lostBetsCount: 0,
      }
    }

    const {
      rawToPayout,
      rawInBets,
      rawTotalPayout,
      rawTotalProfit,
      betsCount,
      wonBetsCount,
      lostBetsCount,
    } = data.reduce((acc, bettor) => {
      const { rawToPayout, rawInBets, rawTotalPayout, rawTotalProfit, betsCount, wonBetsCount, lostBetsCount } = bettor

      acc.rawToPayout += BigInt(rawToPayout)
      acc.rawInBets += BigInt(rawInBets)
      acc.rawTotalPayout += BigInt(rawTotalPayout)
      acc.rawTotalProfit += BigInt(rawTotalProfit)
      acc.betsCount += betsCount
      acc.wonBetsCount += wonBetsCount
      acc.lostBetsCount += lostBetsCount

      return acc
    }, {
      rawToPayout: 0n,
      rawInBets: 0n,
      rawTotalPayout: 0n,
      rawTotalProfit: 0n,
      betsCount: 0,
      wonBetsCount: 0,
      lostBetsCount: 0,
    })

    return {
      toPayout: formatUnits(rawToPayout, betToken.decimals),
      inBets: formatUnits(rawInBets, betToken.decimals),
      totalPayout: formatUnits(rawTotalPayout, betToken.decimals),
      totalProfit: formatUnits(rawTotalProfit, betToken.decimals),
      betsCount,
      wonBetsCount,
      lostBetsCount,
    }
  }, [])

  return useQuery({
    queryKey: [
      'bets-summary',
      gqlLink,
      account,
      affiliates?.join('-'),
    ],
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
    ...query,
  })
}
