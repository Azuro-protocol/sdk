import { type TransactionReceipt, type Address } from 'viem'
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
import { patchBettorRows } from '../helpers/patchBettorRows'


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

// the indexer records a redeem or a cash-out a few seconds after its receipt, and a re-read before
// that would bring back the old figures, so the summaries are read again twice: soon, and once more
// for an indexer that lags
const SUMMARY_REREAD_DELAYS = [ 5000, 15000 ]

export const useBetsCache = (chainId?: ChainId) => {
  const queryClient = useQueryClient()
  const { address } = useExtendedAccount()

  const { betToken, graphql, chain } = useOptionalChain(chainId)

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

    const action = values.isCashedOut ? 'cashout' : values.isRedeemed ? 'redeem' : undefined

    if (!action) {
      return
    }

    // the summary rows mirror what the indexer will record for this bet, on the row of its own pool
    // and affiliate; a summary that cannot be patched that way is re-read at once instead
    const summaryFilter = { queryKey: betsQueryKeys.summaryPrefix({ gqlLink: graphql.bets, account: address! }) }

    queryClient.getQueriesData<BettorsQuery['bettors']>(summaryFilter).forEach(([ queryKey, rows ]) => {
      if (!rows) {
        return
      }

      if (cachedBet) {
        const { rows: newRows, isMatched } = patchBettorRows({
          rows,
          account: address!,
          bet: cachedBet,
          action,
          decimals: betToken.decimals,
        })

        if (isMatched) {
          queryClient.setQueryData(queryKey, newRows, { updatedAt: Date.now() })

          return
        }
      }

      queryClient.invalidateQueries({ queryKey, exact: true })
    })

    SUMMARY_REREAD_DELAYS.forEach(delay => {
      setTimeout(() => queryClient.invalidateQueries(summaryFilter), delay)
    })
  }

  return {
    updateBetCache,
  }
}
