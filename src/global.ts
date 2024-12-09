import type { Address } from 'viem'
import { type Selection, type GraphBetStatus, type GameQuery } from '@azuro-org/toolkit'


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
  game: GameQuery['games'][0]
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
  isWin: boolean
  isLose: boolean
  isRedeemable: boolean
  isRedeemed: boolean
  isCanceled: boolean
  isLive: boolean
  isCashedOut: boolean
}
