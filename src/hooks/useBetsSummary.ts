import { useMemo } from 'react'
import { type QueryHookOptions, useQuery } from '@apollo/client'
import { formatUnits } from 'viem'

import type { BettorsQuery, BettorsQueryVariables } from '../docs/prematch/bettors'
import { BettorsDocument } from '../docs/prematch/bettors'
import { useApolloClients } from '../contexts/apollo'
import { useChain } from '../contexts/chain'


type Props = {
  account: string
  affiliates?: string[]
}

export const useBetsSummary = (props: Props) => {
  const { account, affiliates } = props

  const { betToken } = useChain()
  const { prematchClient } = useApolloClients()

  const options = useMemo<QueryHookOptions<BettorsQuery, BettorsQueryVariables>>(() => {
    const variables: BettorsQueryVariables = {
      where: {
        address: account.toLowerCase(),
      },
    }

    if (affiliates?.length) {
      variables.where.affiliate_in = affiliates.map(affiliate => affiliate.toLowerCase())
    }

    return {
      variables,
      ssr: false,
      client: prematchClient!,
      notifyOnNetworkStatusChange: true,
      skip: !account,
    } as const
  }, [
    account,
    affiliates?.join('-'),
  ])

  const { data, loading, error } = useQuery<BettorsQuery, BettorsQueryVariables>(BettorsDocument, options)

  const { bettors } = data || { bettors: [] }

  const formattedData = useMemo(() => {
    if (!bettors.length) {
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
    } = bettors.reduce((acc, bettor) => {
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
    ...formattedData,
    loading,
    error,
  }
}
