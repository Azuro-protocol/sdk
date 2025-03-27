import type { Address } from 'viem'
import { type Selection, type GraphBetStatus, type GameQuery } from '@azuro-org/toolkit'
import { type UseInfiniteQueryOptions, type DefaultError, type QueryKey, type UseQueryOptions } from '@tanstack/react-query'


export type QueryParameter<
  queryFnData = unknown,
  error = DefaultError,
  data = queryFnData,
  queryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<queryFnData, error, data, queryKey>, 'queryFn' | 'queryHash' | 'queryKey' | 'queryKeyHashFn' | 'throwOnError' | 'select'> | undefined

export type InfiniteQueryParameters<
  queryFnData = unknown,
  error = DefaultError,
  data = queryFnData,
  queryData = queryFnData,
  queryKey extends QueryKey = QueryKey,
  pageParam = number,
> = Omit<UseInfiniteQueryOptions<queryFnData, error, data, queryData, queryKey, pageParam>, 'queryFn' | 'queryHash' | 'queryKey' | 'queryKeyHashFn' | 'throwOnError' | 'select' | 'initialData'>

declare global {
  namespace AzuroSDK {
    interface BetslipItem extends Selection {
      gameId: string
      isExpressForbidden: boolean
    }
  }
}

export enum SportHub {
  Sports = 'sports',
  Esports = 'esports',
  Unique = 'unique'
}

export enum BetType {
  Unredeemed = 'unredeemed',
  Accepted = 'accepted',
  Settled = 'settled',
  CashedOut = 'cashedOut',
}

export type BetOutcome = {
  selectionName: string
  odds: number
  marketName: string
  game: NonNullable<GameQuery['game']>
  isWin: boolean | null
  isLose: boolean | null
  isCanceled: boolean
} & Selection

export type Bet = {
  affiliate: string
  tokenId: string
  freebetId?: string
  freebetContractAddress?: Address
  totalOdds: number
  coreAddress: Address
  lpAddress: Address
  outcomes: BetOutcome[]
  txHash: string
  status: GraphBetStatus
  amount: string
  possibleWin: number
  payout: number | null
  createdAt: number
  cashout?: string
  isWin: boolean
  isLose: boolean
  isRedeemable: boolean
  isRedeemed: boolean
  isCanceled: boolean
  isCashedOut: boolean
}

export type BetsSummary = {
  toPayout: string,
  inBets: string,
  totalPayout: string,
  totalProfit: string,
  betsCount: number,
  wonBetsCount: number,
  lostBetsCount: number,
}
