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

/**
 * Converts a payout cached as a JS number back to base units, for a debit. `String(1e-7)` is '1e-7',
 * which `parseUnits` rejects, so the number is written out in fixed notation first.
 *
 * A number keeps about 16 significant digits, so at 18 decimals it can come back below the figure the
 * subgraph holds by up to about one part in 10^16, and redeeming the last payout of a row would leave
 * that dust behind. The result is rounded up by one part in 10^15, several times that error, so a debit
 * is never short; it adds nothing below 10^15 base units, which keeps 6-decimal tokens exact. On the last
 * payout the excess is lost to the floor at zero, and the re-read restores the exact figure either way.
 * */
const toBaseUnits = (value: number | null, decimals: number) => {
  const amount = value !== null && Number.isFinite(value) ? value : 0
  const units = parseUnits(amount.toFixed(decimals), decimals)

  return units + units / 10n ** 15n
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
