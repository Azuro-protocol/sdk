import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'
import { type Address } from 'viem'

import { type BetsQuery, type BetsQueryVariables, BetsDocument } from '../docs/prematch/bets'
import { type GameQuery } from '../docs/prematch/game'
import { Bet_OrderBy, OrderDirection, BetResult, BetStatus, SelectionResult, ConditionStatus, GameStatus as GraphGameStatus } from '../docs/prematch/types'
import { useApolloClients } from '../contexts/apollo'
import type { Selection } from '../global'


export type PrematchBetOutcome = {
  selectionName: string
  odds: number
  marketName: string
  game: GameQuery['games'][0]
  isWin: boolean | null
  isLose: boolean | null
  isCanceled: boolean
} & Selection

export type PrematchBet = {
  tokenId: string
  freebetId?: string
  freebetContractAddress?: Address
  totalOdds: number
  coreAddress: Address
  lpAddress: Address
  outcomes: PrematchBetOutcome[]
  txHash: string
  status: BetStatus
  amount: string
  possibleWin: number
  payout: number | null
  createdAt: number
  isWin: boolean
  isLose: boolean
  isRedeemable: boolean
  isRedeemed: boolean
  isCanceled: boolean
}

export type UsePrematchBetsProps = {
  filter: {
    bettor: Address
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

  const { prematchClient } = useApolloClients()

  const options = useMemo(() => {
    const variables: BetsQueryVariables = {
      first: filter.limit || 1000,
      skip: filter.offset,
      orderBy,
      orderDirection: orderDir,
      where: {
        actor: filter.bettor?.toLowerCase(),
      },
    }

    return {
      variables,
      ssr: false,
      client: prematchClient!,
      skip: !filter.bettor,
      notifyOnNetworkStatusChange: true,
    }
  }, [
    filter.limit,
    filter.offset,
    filter.bettor,
    orderBy,
    orderDir,
  ])

  const { data, loading, error } = useQuery<BetsQuery, BetsQueryVariables>(BetsDocument, options)

  const bets = useMemo(() => {
    if (!data?.bets?.length) {
      return []
    }

    return data.bets.map((rawBet) => {
      const {
        tokenId, status, amount, odds, settledOdds, createdAt, result, core: { address: coreAddress, liquidityPool: { address: lpAddress } },
        payout: _payout, isRedeemed: _isRedeemed, isRedeemable, freebet, txHash, selections,
      } = rawBet

      const isWin = result === BetResult.Won
      const isLose = result === BetResult.Lost
      const isCanceled = status === BetStatus.Canceled
      // express bets have a specific feature - protocol redeems LOST expresses to release liquidity,
      // so we should validate it by "win"/"canceled" statuses
      const isRedeemed = (isWin || isCanceled) && _isRedeemed
      const isFreebet = Boolean(freebet)
      const freebetId = freebet?.freebetId
      const freebetContractAddress = freebet?.contractAddress
      const payout = isRedeemable && isWin ? +_payout! : null
      const betDiff = isFreebet ? amount : 0 // for freebet we must exclude bonus value from possible win
      const totalOdds = settledOdds ? +settledOdds : +odds
      const possibleWin = +amount * totalOdds - +betDiff

      const outcomes: PrematchBetOutcome[] = selections
        .map((selection) => {
          const { odds, result, outcome: { outcomeId, condition: { conditionId, status: conditionStatus, game } } } = selection

          const isWin = result ? result === SelectionResult.Won : null
          const isLose = result ? result === SelectionResult.Lost : null
          const isCanceled = (
            conditionStatus === ConditionStatus.Canceled
            || game.status === GraphGameStatus.Canceled
          )

          const marketName = getMarketName({ outcomeId })
          const selectionName = getSelectionName({ outcomeId, withPoint: true })

          return {
            selectionName,
            outcomeId,
            conditionId,
            coreAddress,
            odds: +odds,
            marketName,
            game,
            isWin,
            isLose,
            isCanceled,
          }
        })
        .sort((a, b) => +a.game.startsAt - +b.game.startsAt)

      const bet: PrematchBet = {
        tokenId,
        freebetContractAddress: freebetContractAddress as Address,
        freebetId,
        txHash,
        totalOdds,
        status,
        amount,
        possibleWin,
        payout,
        createdAt: +createdAt,
        isWin,
        isLose,
        isRedeemable,
        isRedeemed,
        isCanceled,
        coreAddress: coreAddress as Address,
        lpAddress: lpAddress as Address,
        outcomes,
      }

      return bet
    })
  }, [ data ])

  return {
    loading,
    bets,
    error,
  }
}
