import { type TransactionReceipt, type Address, parseUnits } from 'viem'
import {
  type BettorsQuery,
  type Selection,
  type ChainId,
} from '@azuro-org/toolkit'
import { useQueryClient } from '@tanstack/react-query'

import { useOptionalChain } from '../contexts/chain'
import { useExtendedAccount } from '../hooks/useAaConnector'
import { type Bet } from '../global'
import { betsQueryKeys } from '../helpers/betsQueryKeys'


export type NewBetProps = {
  bet: {
    rawAmount: bigint
    selections: Selection[]
    freebetId: string | undefined
    isFreebetAmountReturnable: boolean | undefined
  }
  odds: Record<string, number>
  affiliate: Address
  receipt: TransactionReceipt
}

export const useBetsCache = (chainId?: ChainId) => {
  const queryClient = useQueryClient()
  const { address } = useExtendedAccount()

  const { contracts, betToken, graphql, chain } = useOptionalChain(chainId)

  const updateBetCache = (
    tokenId: string | bigint,
    values: Partial<Bet>,
    isLegacy?: boolean
  ) => {
    let cachedBet: Bet | undefined
    const betsKey = isLegacy ? 'legacy-bets' : 'bets'

    queryClient.setQueriesData({
      predicate: ({ queryKey }) => (
        queryKey[0] === betsKey &&
        queryKey[1] === chain.id &&
        String(queryKey[2]).toLowerCase() === address!.toLowerCase()
      ),
    }, (data: { pages: { bets: Bet[], nextPage: number | undefined }[], pageParams: number[] }) => {
      if (!data) {
        return data
      }

      const { pages, pageParams } = data

      const newPages = pages.map(page => {
        const { bets, nextPage } = page

        return {
          nextPage,
          bets: bets.map(bet => {
            if (bet.tokenId === tokenId) {
              cachedBet = {
                ...bet,
                ...values,
              }

              return cachedBet
            }

            return bet
          }),
        }
      })

      return {
        pages: newPages,
        pageParams,
      }
    })

    // the report is an exact aggregate over every bet matching a filter, and a redeem or a cashout
    // can change both the figures and which bets match at all, so there is no honest way to patch
    // it in place from a single bet: it has to be recomputed
    queryClient.invalidateQueries({
      queryKey: betsQueryKeys.reportPrefix({ chainId: chain.id, bettor: address! }),
    })

    if (!values.isCashedOut && !cachedBet?.payout && !cachedBet?.isCanceled) {
      return
    }

    queryClient.setQueriesData({
      predicate: ({ queryKey }) => (
        queryKey[0] === 'bets-summary' &&
        queryKey[1] === graphql.bets &&
        String(queryKey[2]).toLowerCase() === address!.toLowerCase()
      ),
    }, (oldData: BettorsQuery['bettors']) => {
      if (!oldData) {
        return oldData
      }

      const newData = [ ...oldData ]
      const bettorIndex = newData.findIndex(({ id }) => id.split('_')[0]?.toLowerCase() === contracts.lp.address.toLowerCase())

      if (bettorIndex === -1) {
        return oldData
      }

      const bettor = { ...newData[bettorIndex]! }

      if (cachedBet!.payout || cachedBet!.isCanceled) {
        const rawAmount = cachedBet!.isCanceled ? cachedBet!.amount : cachedBet!.payout
        const rawPayout = parseUnits(String(rawAmount), betToken.decimals)
        const newRawToPayout = BigInt(bettor.rawToPayout) - rawPayout

        bettor.rawToPayout = String(newRawToPayout)
      }

      if (values.isCashedOut) {
        const rawAmount = parseUnits(cachedBet!.amount, betToken.decimals)

        bettor.rawInBets = String(BigInt(bettor.rawInBets) - rawAmount)
        bettor.betsCount -= 1
      }

      newData[bettorIndex] = bettor

      return newData
    }, {
      updatedAt: Date.now(),
    })
  }

  return {
    updateBetCache,
  }
}
