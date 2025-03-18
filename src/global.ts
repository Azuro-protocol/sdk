import type { Address } from 'viem'
import { type Selection, type GraphBetStatus, type GameQuery } from '@azuro-org/toolkit'
import { type DefaultError, type QueryKey } from '@tanstack/react-query'
import { type UseQueryParameters } from 'wagmi/query'


export type QueryParameter<
  queryFnData = unknown,
  error = DefaultError,
  data = queryFnData,
  queryKey extends QueryKey = QueryKey,
> = Omit<UseQueryParameters<queryFnData, error, data, queryKey>, 'queryFn' | 'queryHash' | 'queryKey' | 'queryKeyHashFn' | 'throwOnError' | 'select'> | undefined

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
  game: GameQuery['game']
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
  isLive: boolean
  isCashedOut: boolean
}
