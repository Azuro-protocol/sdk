import { type Address, type Hex } from 'viem'
import { type Selection, type GraphBetStatus, type GameQuery } from '@azuro-org/toolkit'
import { type UseInfiniteQueryOptions, type DefaultError, type QueryKey, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query'


export type QueryParameter<
  queryFnData = unknown,
  error = DefaultError,
  data = queryFnData,
  queryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<queryFnData, error, data, queryKey>, 'queryFn' | 'queryHash' | 'queryKey' | 'queryKeyHashFn' | 'throwOnError' | 'select'> | undefined


export type WrapperUseQueryResult<D, T> = {
  data: D
} & Omit<UseQueryResult<T>, 'data'>

export type InfiniteQueryParameters<
  queryFnData = unknown,
  error = DefaultError,
  data = queryFnData,
  queryData = queryFnData,
  queryKey extends QueryKey = QueryKey,
  pageParam = number,
> = Omit<UseInfiniteQueryOptions<queryFnData, error, data, queryData, queryKey, pageParam>, 'queryFn' | 'queryHash' | 'queryKey' | 'queryKeyHashFn' | 'throwOnError' | 'select' | 'initialData' | 'getNextPageParam' | 'initialPageParam'>

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
  wonOutcomeIds: string[] | null
  isLive: boolean
  isWin: boolean | null
  isLose: boolean | null
  isCanceled: boolean
} & Selection

export type Bet = {
  actor: Address
  affiliate: Address
  tokenId: string
  freebetId: string | null
  isFreebetAmountReturnable: boolean | null
  paymaster: Address | null
  totalOdds: number
  coreAddress: Address
  lpAddress: Address
  outcomes: BetOutcome[]
  txHash: Hex
  redeemedTxHash: Hex | null
  status: GraphBetStatus
  amount: string
  possibleWin: number
  payout: number | null
  createdAt: number
  resolvedAt: number | null
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
