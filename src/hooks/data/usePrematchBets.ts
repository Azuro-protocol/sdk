import { useMemo } from 'react'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'
import { type Address } from 'viem'
import {
  Bet_OrderBy,
  OrderDirection,
  BetResult,
  GraphBetStatus,
  SelectionResult,

  // type PrematchBetsQuery,
  // type PrematchBetsQueryVariables,
  // PrematchBetsDocument,
} from '@azuro-org/toolkit'

import { type BetOutcome, type Bet, type BetType } from '../../global'


export type UsePrematchBetsProps = {
  filter: {
    bettor: Address
    affiliate?: string
    type?: BetType
    limit?: number
    offset?: number
  }
  orderBy?: Bet_OrderBy
  orderDir?: OrderDirection
}

export const usePrematchBets = (props: UsePrematchBetsProps) => {
  const {
    filter,
    orderBy = Bet_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Asc,
  } = props

  // const { prematchClient } = useApolloClients()

  // const options = useMemo(() => {
  //   const variables: PrematchBetsQueryVariables = {
  //     first: filter.limit || 1000,
  //     skip: filter.offset,
  //     orderBy,
  //     orderDirection: orderDir,
  //     where: {
  //       actor: filter.bettor?.toLowerCase(),
  //     },
  //   }

  //   if (filter.type === BetType.Unredeemed) {
  //     variables.where.isRedeemable = true
  //   }

  //   if (filter.type === BetType.Accepted) {
  //     variables.where.status = GraphBetStatus.Accepted
  //     variables.where.isCashedOut = false
  //   }

  //   if (filter.type === BetType.Settled) {
  //     variables.where.status_in = [ GraphBetStatus.Resolved, GraphBetStatus.Canceled ]
  //   }

  //   if (filter.type === BetType.CashedOut) {
  //     variables.where.isCashedOut = true
  //   }

  //   if (filter.affiliate) {
  //     variables.where.affiliate = filter.affiliate
  //   }

  //   return {
  //     variables,
  //     ssr: false,
  //     client: prematchClient!,
  //     skip: !filter.bettor,
  //     notifyOnNetworkStatusChange: true,
  //   } as const
  // }, [
  //   filter.limit,
  //   filter.offset,
  //   filter.bettor,
  //   filter.type,
  //   filter.affiliate,
  //   orderBy,
  //   orderDir,
  // ])

  // const { data, loading, error } = useQuery<PrematchBetsQuery, PrematchBetsQueryVariables>(PrematchBetsDocument, options)

  // const bets = useMemo(() => {
  //   if (!data?.bets?.length) {
  //     return []
  //   }

  //   return data.bets.map((rawBet) => {
  //     const {
  //       tokenId, status, amount, odds, settledOdds, createdAt, result, affiliate,
  //       core: { address: coreAddress, liquidityPool: { address: lpAddress } }, cashout: _cashout, isCashedOut,
  //       payout: _payout, isRedeemed: _isRedeemed, isRedeemable, freebet, txHash, selections,
  //     } = rawBet

  //     const isWin = result === BetResult.Won
  //     const isLose = result === BetResult.Lost
  //     const isCanceled = status === GraphBetStatus.Canceled
  //     // express bets have a specific feature - protocol redeems LOST expresses to release liquidity,
  //     // so we should validate it by "win"/"canceled" statuses
  //     const isRedeemed = (isWin || isCanceled) && _isRedeemed
  //     const isFreebet = Boolean(freebet)
  //     const freebetId = freebet?.freebetId
  //     const freebetContractAddress = freebet?.contractAddress
  //     const payout = isRedeemable && isWin ? +_payout! : null
  //     const betDiff = isFreebet ? amount : 0 // for freebet we must exclude bonus value from possible win
  //     const totalOdds = settledOdds ? +settledOdds : +odds
  //     const possibleWin = +amount * totalOdds - +betDiff
  //     const cashout = isCashedOut ? _cashout?.payout : undefined

  //     const outcomes: BetOutcome[] = selections
  //       .map((selection) => {
  //         const {
  //           odds,
  //           result,
  //           outcome: {
  //             outcomeId,
  //             title: customSelectionName,
  //             condition: {
  //               conditionId,
  //               status: conditionStatus,
  //               title: customMarketName,
  //               game,
  //             },
  //           },
  //         } = selection

  //         const isWin = result ? result === SelectionResult.Won : null
  //         const isLose = result ? result === SelectionResult.Lost : null
  //         const isCanceled = (
  //           conditionStatus === ConditionStatus.Canceled
  //           || game.status === PrematchGraphGameStatus.Canceled
  //         )

  //         const marketName = customMarketName && customMarketName !== 'null' ? customMarketName : getMarketName({ outcomeId })
  //         const selectionName = customSelectionName && customSelectionName !== 'null' ? customSelectionName : getSelectionName({ outcomeId, withPoint: true })

  //         return {
  //           selectionName,
  //           outcomeId,
  //           conditionId,
  //           coreAddress,
  //           odds: +odds,
  //           marketName,
  //           game,
  //           isWin,
  //           isLose,
  //           isCanceled,
  //         }
  //       })
  //       .sort((a, b) => +a.game.startsAt - +b.game.startsAt)

  //     const bet: Bet = {
  //       affiliate: affiliate!,
  //       tokenId,
  //       freebetContractAddress: freebetContractAddress as Address,
  //       freebetId,
  //       txHash,
  //       totalOdds,
  //       status,
  //       amount,
  //       possibleWin,
  //       payout,
  //       createdAt: +createdAt,
  //       cashout,
  //       isWin,
  //       isLose,
  //       isRedeemable,
  //       isRedeemed,
  //       isCanceled,
  //       isCashedOut,
  //       coreAddress: coreAddress as Address,
  //       lpAddress: lpAddress as Address,
  //       outcomes,
  //       isLive: false,
  //     }

  //     return bet
  //   })
  // }, [ data ])

  return {
    loading: false,
    bets: [],
    error: null,
  }
}
