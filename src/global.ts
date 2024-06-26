import type { Address } from 'viem'

import { type BetStatus } from './docs/prematch/types'
import { type GameQuery } from './docs/prematch/game'


export type Selection = {
  outcomeId: string
  conditionId: string
  coreAddress: string
}

export enum SportHub {
  Sports = 'sports',
  Esports = 'esports'
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
  tokenId: string
  freebetId?: string
  freebetContractAddress?: Address
  totalOdds: number
  coreAddress: Address
  lpAddress: Address
  outcomes: BetOutcome[]
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
  isLive: boolean
}

export type WaveId = number | 'active'
