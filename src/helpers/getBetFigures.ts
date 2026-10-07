import { formatUnits } from 'viem'
import {
  type BetFragment,
  BetResult,
  GraphBetStatus,
  calcFreebetBettorShare,
} from '@azuro-org/toolkit'


export type BetFiguresSource = Pick<BetFragment,
  'status' | 'result' | 'odds' | 'settledOdds' | 'rawAmount' | 'rawPotentialPayout' | 'rawPayout'
  | 'isRedeemable' | 'isCashedOut' | 'freebetId' | 'isFreebetAmountReturnable'>

export type BetFigures = {
  totalOdds: number
  possibleWin: number
  payout: number | null
  settledPayout: number | null
}

/**
 * A v3 bet's odds and money figures as the bets subgraph records them: nothing is re-priced.
 *
 * For a freebet, the money figures - `possibleWin`, `payout` and `settledPayout` - are the bettor's
 * share of what the subgraph records, per `calcFreebetBettorShare`: the pool pays a freebet's whole
 * payout to the freebet contract, not to the bettor.
 *
 * `settledPayout` is the recorded payout once the bet is won, lost or canceled. `payout` is the same
 * figure but only while it can still be claimed - a won or canceled bet that is redeemable and was not
 * cashed out - and `null` otherwise.
 * */
export const getBetFigures = (bet: BetFiguresSource, decimals: number): BetFigures => {
  const {
    status, result, odds, settledOdds, rawAmount, rawPotentialPayout, rawPayout,
    isRedeemable, isCashedOut, freebetId, isFreebetAmountReturnable,
  } = bet

  const isWin = result === BetResult.Won
  const isLose = result === BetResult.Lost
  const isCanceled = status === GraphBetStatus.Canceled
  const isSettled = isWin || isLose || isCanceled
  const isFreebet = Boolean(freebetId)
  const amount = BigInt(rawAmount)

  const toFigure = (rawValue: string): number => {
    const value = BigInt(rawValue)
    const share = isFreebet
      ? calcFreebetBettorShare({ payout: value, amount, isAmountReturnable: isFreebetAmountReturnable })
      : value

    return +formatUnits(share, decimals)
  }

  const hasPayout = rawPayout !== null && rawPayout !== undefined

  const totalOdds = +(settledOdds ?? odds)
  // a canceled bet will never pay its potential payout, so it reports what it returns instead
  const possibleWin = toFigure(isCanceled ? rawPayout ?? rawAmount : rawPotentialPayout)
  const settledPayout = isSettled && hasPayout ? toFigure(rawPayout) : null
  const isClaimable = isRedeemable && (isWin || isCanceled) && !isCashedOut
  const payout = isClaimable && hasPayout ? toFigure(rawPayout) : null

  return {
    totalOdds,
    possibleWin,
    payout,
    settledPayout,
  }
}
