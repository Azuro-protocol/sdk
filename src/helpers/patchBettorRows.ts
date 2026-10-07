import { parseUnits } from 'viem'
import { type BettorFragment } from '@azuro-org/toolkit'

import { type Bet } from '../global'


export type PatchBettorRowsProps = {
  rows: BettorFragment[]
  account: string
  bet: Pick<Bet, 'lpAddress' | 'affiliate' | 'amount' | 'settledPayout' | 'freebetId' | 'isCanceled'>
  action: 'redeem' | 'cashout'
  decimals: number
}

// `String(1e-7)` is '1e-7', which `parseUnits` rejects, so the number is written out in fixed notation first
const toBaseUnits = (value: number | null, decimals: number) => {
  const amount = value !== null && Number.isFinite(value) ? value : 0

  return parseUnits(amount.toFixed(decimals), decimals)
}

const debit = (value: string, amount: bigint) => {
  const rest = BigInt(value) - amount

  return String(rest > 0n ? rest : 0n)
}

/**
 * Applies to the bettor summary rows what the bets subgraph records when one bet is redeemed or cashed
 * out, so the summary is right before the indexer catches up.
 *
 * Only the row of the bet's own pool and affiliate changes, and every figure it lowers stops at zero.
 * When no row matches, the rows are returned untouched with `isMatched: false`.
 * */
export const patchBettorRows = (props: PatchBettorRowsProps): { rows: BettorFragment[], isMatched: boolean } => {
  const { rows, account, bet, action, decimals } = props

  const rowId = `${bet.lpAddress}_${account}_${bet.affiliate}`.toLowerCase()
  const index = rows.findIndex(({ id }) => id.toLowerCase() === rowId)

  if (index === -1) {
    return { rows, isMatched: false }
  }

  const row = { ...rows[index]! }

  if (action === 'cashout') {
    // a cash-out takes the stake out of the bets in play; `betsCount` and `rawToPayout` stay as they are
    row.rawInBets = debit(row.rawInBets, parseUnits(bet.amount, decimals))
    row.cashedOutBetsCount += 1
  }
  else if (bet.freebetId) {
    // a freebet's settlement credits the bettor's share, which is what `settledPayout` holds for it
    row.rawFreebetToPayout = debit(row.rawFreebetToPayout, toBaseUnits(bet.settledPayout, decimals))
  }
  else {
    const rawPayout = bet.isCanceled ? parseUnits(bet.amount, decimals) : toBaseUnits(bet.settledPayout, decimals)

    row.rawToPayout = debit(row.rawToPayout, rawPayout)
  }

  return {
    rows: rows.map((item, itemIndex) => itemIndex === index ? row : item),
    isMatched: true,
  }
}
