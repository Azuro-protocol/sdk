import { useMemo } from 'react'
import { formatUnits } from 'viem'
import { type BettorsQuery, type BettorsQueryVariables, BettorsDocument } from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'

import { useChain } from '../../contexts/chain'


type Props = {
  account: string
  affiliates?: string[]
}

export const useBetsSummary = (props: Props) => {
  const { account, affiliates } = props

  const { betToken, graphql } = useChain()

  const gqlLink = graphql.prematch

  const { data, ...rest } = useQuery({
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

      const { bettors } = await request<BettorsQuery, BettorsQueryVariables>({
        url: gqlLink,
        document: BettorsDocument,
        variables,
      })

      return bettors
    },
  })

  const formattedData = useMemo(() => {
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
  }, [ data ])

  return {
    data: formattedData,
    ...rest,
  }
}
