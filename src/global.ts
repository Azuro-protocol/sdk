import { type Address, type Hex } from 'viem'
import { type Selection, type GraphBetStatus, type GameData, type BetOrderState } from '@azuro-org/toolkit'
import { type UseInfiniteQueryOptions, type DefaultError, type QueryKey, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query'


export type QueryParameter<
  queryFnData = unknown,
  error = DefaultError,
  data = queryFnData,
  queryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<queryFnData, error, data, queryKey>, 'queryFn' | 'queryHash' | 'queryKey' | 'queryKeyHashFn' | 'throwOnError' | 'select'> | undefined

export type QueryParameterWithSelect<
  QueryFnData = unknown,
  TData = QueryFnData,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<QueryFnData, TError, TData, TQueryKey>, 'queryFn' | 'queryHash' | 'queryKey' | 'queryKeyHashFn' | 'throwOnError'> | undefined

export type WrapperUseQueryResult<D, T> = {
  data: D
} & Omit<UseQueryResult<T>, 'data'>

export type InfiniteQueryParameters<
  queryFnData = unknown,
  error = DefaultError,
  data = queryFnData,
  queryKey extends QueryKey = QueryKey,
  pageParam = number,
> = Omit<UseInfiniteQueryOptions<queryFnData, error, data, queryKey, pageParam>, 'queryFn' | 'queryHash' | 'queryKey' | 'queryKeyHashFn' | 'throwOnError' | 'select' | 'initialData' | 'getNextPageParam' | 'initialPageParam'>

export type InfiniteQueryParametersWithSelect<
  queryFnData = unknown,
  data = queryFnData,
  error = DefaultError,
  queryKey extends QueryKey = QueryKey,
  pageParam = number,
> = Omit<UseInfiniteQueryOptions<queryFnData, error, data, queryKey, pageParam>, 'queryFn' | 'queryHash' | 'queryKey' | 'queryKeyHashFn' | 'throwOnError' | 'initialData' | 'getNextPageParam' | 'initialPageParam'>

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
}

export enum BetType {
  Unredeemed = 'unredeemed',
  Pending = 'pending',
  Accepted = 'accepted',
  Settled = 'settled',
  CashedOut = 'cashedOut',
}

export type BetOutcome = {
  selectionName: string
  odds: number
  marketName: string
  game: GameData
  wonOutcomeIds: string[] | null
  isLive: boolean
  isWin: boolean | null
  isLose: boolean | null
  isCanceled: boolean
} & Selection

export type Bet = {
  /** bettorAddressLowerCase_nonce */
  orderId: string
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
  txHash: Hex | null
  redeemedTxHash: Hex | null
  orderState: BetOrderState
  /**
   * graphql bet status,
   * it can be null for bet with `orderState` in
   * Created, Placed, Sent, Canceled, Rejected
   * */
  status: GraphBetStatus | null
  /** contract error code if bet state is BetState.Rejected */
  rejectedErrorCode: string | null
  amount: string
  possibleWin: number
  payout: number | null
  createdAt: number
  resolvedAt: number | null
  redeemedAt?: number | null
  cashout?: string
  isWin: boolean
  isLose: boolean
  isRedeemable: boolean
  isRedeemed: boolean
  isCanceled: boolean
  isRejected: boolean
  isCashedOut: boolean
}

export type BetsSummary = {
  toPayout: string
  inBets: string
  totalPayout: string
  totalProfit: string
  betsCount: number
  wonBetsCount: number
  lostBetsCount: number
}
