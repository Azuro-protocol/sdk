import { type Address, type Hex } from 'viem'
import {
  type Selection, type GraphBetStatus, type GameData, type BetOrderState, BetStatusFilter,
} from '@azuro-org/toolkit'
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

export { BetStatusFilter, BetKind } from '@azuro-org/toolkit'

/**
 * @deprecated Renamed to `BetStatusFilter` - these are lifecycle statuses, not bet types.
 * For single/combo use `filter.kind` + `BetKind`. Will be removed in @azuro-org/sdk v9.
 *
 * This is an alias of the very same enum object, so `BetType.Accepted === BetStatusFilter.Accepted`
 * and existing call sites keep working unchanged, at runtime and in the type checker.
 * */
export const BetType = BetStatusFilter
/**
 * @deprecated Renamed to `BetStatusFilter`. Will be removed in @azuro-org/sdk v9.
 * */
export type BetType = BetStatusFilter

export type BetOutcome = {
  selectionName: string
  odds: number
  marketName: string
  game: GameData
  isLive: boolean
  isWin: boolean | null
  isLose: boolean | null
  isCanceled: boolean
} & Selection

/**
 * A v3 bet with its figures as the bets subgraph records them: nothing is re-priced on the client.
 *
 * For a freebet, the money figures - `possibleWin`, `payout` and `settledPayout` - are the bettor's
 * share. The pool pays a freebet's whole payout to the freebet contract, which sends the bettor the
 * payout less the stake when the freebet's amount is returnable, the whole payout when it is not, and
 * nothing when the payout is no greater than the stake. A freebet without a returnable flag is valued
 * as returnable. See `calcFreebetBettorShare` in `@azuro-org/toolkit`.
 * */
export type Bet = {
  /** bettorAddressLowerCase_nonce */
  orderId: string
  actor: Address
  affiliate: Address
  tokenId: string
  freebetId: string | null
  isFreebetAmountReturnable: boolean | null
  paymaster: Address | null
  /**
   * The odds the subgraph recorded: the settled odds once the bet is settled - a voided leg left out,
   * exactly 1 for a canceled bet - and the placed odds before that.
   * */
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
  /**
   * What the bet pays if it wins: the potential payout the subgraph recorded at placement. A canceled
   * bet reports what it returns instead - the stake, or 0 for a freebet. The bettor's share for a
   * freebet.
   * */
  possibleWin: number
  /**
   * Claimable amount: non-null only while there is money left to redeem, and `null` once the bet
   * has been redeemed or cashed out. Use it to gate a redeem action. A canceled bet's is its stake,
   * or 0 for a freebet. The bettor's share for a freebet.
   *
   * To display what a bet actually returned - in a history list, or next to an aggregate that
   * counts settled bets - use `settledPayout` instead, which survives redemption.
   * */
  payout: number | null
  /**
   * Payout as recorded by the protocol, whether or not it has already been claimed: 0 for a lost
   * bet, the stake for a canceled one, and once redeemed, the amount actually paid. `null` while the
   * bet is unsettled, and for a cashed out bet it is the notional payout the bet would have produced,
   * not what the bettor received - read `cashout` for that. The bettor's share for a freebet.
   * */
  settledPayout: number | null
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

/**
 * A wallet's betting totals on one chain, as the bets subgraph keeps them. Amounts are formatted with
 * the chain's bet token decimals.
 *
 * The top-level figures cover bets placed with the wallet's own funds; freebets are counted only in
 * `freebet`, whose payouts are the bettor's share.
 * */
export type BetsSummary = {
  /** payouts and refunds of settled bets that are not yet redeemed */
  toPayout: string
  /** stakes of bets that are not settled yet */
  inBets: string
  totalPayout: string
  totalProfit: string
  betsCount: number
  wonBetsCount: number
  lostBetsCount: number
  canceledBetsCount: number
  cashedOutBetsCount: number
  /** what the wallet can redeem now: `toPayout` plus `freebet.toPayout` */
  withdrawable: string
  freebet: {
    betsCount: number
    wonBetsCount: number
    lostBetsCount: number
    canceledBetsCount: number
    /** stakes of every freebet placed */
    turnover: string
    /** stakes of freebets that are not settled yet */
    inBets: string
    /** the bettor's share of settled freebets that are not yet redeemed */
    toPayout: string
    /** the bettor's share of what redeemed freebets paid out */
    totalPayout: string
  }
}
