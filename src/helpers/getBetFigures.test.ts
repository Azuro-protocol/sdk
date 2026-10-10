import { parseUnits } from 'viem'
import { BetResult, GraphBetStatus } from '@azuro-org/toolkit'
import { describe, expect, it } from 'vitest'

import { type BetFiguresSource, getBetFigures } from './getBetFigures'


const DECIMALS = 6

const raw = (value: string, decimals = DECIMALS): string => parseUnits(value, decimals).toString()

type Funding = Pick<BetFiguresSource, 'freebetId' | 'isFreebetAmountReturnable'>

const REAL_MONEY: Funding = {}
const RETURNABLE_FREEBET: Funding = { freebetId: '1', isFreebetAmountReturnable: true }
const NON_RETURNABLE_FREEBET: Funding = { freebetId: '1', isFreebetAmountReturnable: false }
const FLAGLESS_FREEBET: Funding = { freebetId: '1' }

// a bet of 1.00 at odds 1.50, still pending
const placed = (overrides: Partial<BetFiguresSource> = {}): BetFiguresSource => ({
  status: GraphBetStatus.Accepted,
  odds: '1.5',
  rawAmount: raw('1'),
  rawPotentialPayout: raw('1.5'),
  isRedeemable: false,
  isCashedOut: false,
  ...overrides,
})

const won = (funding: Funding): BetFiguresSource => placed({
  ...funding,
  status: GraphBetStatus.Resolved,
  result: BetResult.Won,
  settledOdds: '1.5',
  rawPayout: raw('1.5'),
  isRedeemable: true,
})

// a combo whose voided leg came out of the settled odds, then redeemed for 1.20
const wonAndRedeemed = (funding: Funding): BetFiguresSource => placed({
  ...funding,
  status: GraphBetStatus.Resolved,
  result: BetResult.Won,
  settledOdds: '1.2',
  rawPayout: raw('1.2'),
  isRedeemable: false,
})

const lost = (funding: Funding): BetFiguresSource => placed({
  ...funding,
  status: GraphBetStatus.Resolved,
  result: BetResult.Lost,
  settledOdds: '1.5',
  rawPayout: '0',
  isRedeemable: false,
})

const canceled = (funding: Funding, stake: string, potentialPayout: string): BetFiguresSource => placed({
  ...funding,
  status: GraphBetStatus.Canceled,
  result: null,
  rawAmount: raw(stake),
  rawPotentialPayout: raw(potentialPayout),
  settledOdds: '1',
  rawPayout: raw(stake),
  isRedeemable: true,
})

describe('getBetFigures', () => {
  describe('pending', () => {
    it('reports the placed odds and the potential payout, with nothing settled or claimable', () => {
      expect(getBetFigures(placed(REAL_MONEY), DECIMALS)).toEqual({
        totalOdds: 1.5,
        possibleWin: 1.5,
        payout: null,
        settledPayout: null,
      })
    })

    it('reports a returnable freebet\'s potential payout less its stake', () => {
      expect(getBetFigures(placed(RETURNABLE_FREEBET), DECIMALS)).toEqual({
        totalOdds: 1.5,
        possibleWin: 0.5,
        payout: null,
        settledPayout: null,
      })
    })

    it('reports a non-returnable freebet\'s whole potential payout', () => {
      expect(getBetFigures(placed(NON_RETURNABLE_FREEBET), DECIMALS).possibleWin).toBe(1.5)
    })

    it('values a freebet without a returnable flag as returnable', () => {
      expect(getBetFigures(placed(FLAGLESS_FREEBET), DECIMALS).possibleWin).toBe(0.5)
    })
  })

  describe('won', () => {
    it('reports the recorded payout as settled and claimable while not redeemed', () => {
      expect(getBetFigures(won(REAL_MONEY), DECIMALS)).toEqual({
        totalOdds: 1.5,
        possibleWin: 1.5,
        payout: 1.5,
        settledPayout: 1.5,
      })
    })

    it('reports a returnable freebet\'s share as the payout less the stake', () => {
      expect(getBetFigures(won(RETURNABLE_FREEBET), DECIMALS)).toEqual({
        totalOdds: 1.5,
        possibleWin: 0.5,
        payout: 0.5,
        settledPayout: 0.5,
      })
    })

    it('reports a non-returnable freebet\'s share as the whole payout', () => {
      expect(getBetFigures(won(NON_RETURNABLE_FREEBET), DECIMALS)).toEqual({
        totalOdds: 1.5,
        possibleWin: 1.5,
        payout: 1.5,
        settledPayout: 1.5,
      })
    })

    it('values a won freebet without a returnable flag as returnable', () => {
      expect(getBetFigures(won(FLAGLESS_FREEBET), DECIMALS)).toEqual({
        totalOdds: 1.5,
        possibleWin: 0.5,
        payout: 0.5,
        settledPayout: 0.5,
      })
    })

    it('reports a claimable share of 0 as 0, not null', () => {
      const bet = { ...won(RETURNABLE_FREEBET), settledOdds: '1', rawPayout: raw('1') }

      expect(getBetFigures(bet, DECIMALS).payout).toBe(0)
    })

    it('keeps the amount paid as settled once redeemed, with nothing left to claim', () => {
      expect(getBetFigures(wonAndRedeemed(REAL_MONEY), DECIMALS)).toEqual({
        totalOdds: 1.2,
        possibleWin: 1.5,
        payout: null,
        settledPayout: 1.2,
      })
    })

    it('keeps a redeemed returnable freebet\'s share of the amount paid as settled', () => {
      expect(getBetFigures(wonAndRedeemed(RETURNABLE_FREEBET), DECIMALS)).toEqual({
        totalOdds: 1.2,
        possibleWin: 0.5,
        payout: null,
        settledPayout: 0.2,
      })
    })
  })

  describe('lost', () => {
    it('keeps the missed potential payout and settles at 0', () => {
      expect(getBetFigures(lost(REAL_MONEY), DECIMALS)).toEqual({
        totalOdds: 1.5,
        possibleWin: 1.5,
        payout: null,
        settledPayout: 0,
      })
    })

    it('keeps a returnable freebet\'s missed share and settles at 0', () => {
      expect(getBetFigures(lost(RETURNABLE_FREEBET), DECIMALS)).toEqual({
        totalOdds: 1.5,
        possibleWin: 0.5,
        payout: null,
        settledPayout: 0,
      })
    })
  })

  describe('canceled', () => {
    it('returns the stake of a real-money bet at odds 1', () => {
      expect(getBetFigures(canceled(REAL_MONEY, '5', '7.5'), DECIMALS)).toEqual({
        totalOdds: 1,
        possibleWin: 5,
        payout: 5,
        settledPayout: 5,
      })
    })

    it('returns nothing to the bettor of a freebet', () => {
      expect(getBetFigures(canceled(RETURNABLE_FREEBET, '1', '1.5'), DECIMALS)).toEqual({
        totalOdds: 1,
        possibleWin: 0,
        payout: 0,
        settledPayout: 0,
      })
      expect(getBetFigures(canceled(NON_RETURNABLE_FREEBET, '1', '1.5'), DECIMALS)).toEqual({
        totalOdds: 1,
        possibleWin: 0,
        payout: 0,
        settledPayout: 0,
      })
    })

    it('keeps the stake as settled once the refund is redeemed', () => {
      const bet = { ...canceled(REAL_MONEY, '5', '7.5'), isRedeemable: false }

      expect(getBetFigures(bet, DECIMALS)).toEqual({
        totalOdds: 1,
        possibleWin: 5,
        payout: null,
        settledPayout: 5,
      })
    })

    it('reports the stake as what it returns when no payout is recorded', () => {
      const bet = { ...canceled(REAL_MONEY, '5', '7.5'), rawPayout: null }

      expect(getBetFigures(bet, DECIMALS)).toEqual({
        totalOdds: 1,
        possibleWin: 5,
        payout: null,
        settledPayout: null,
      })
    })
  })

  describe('cashed out', () => {
    it('has nothing settled or claimable while the bet is unsettled', () => {
      const bet = placed({ isCashedOut: true })

      expect(getBetFigures(bet, DECIMALS)).toEqual({
        totalOdds: 1.5,
        possibleWin: 1.5,
        payout: null,
        settledPayout: null,
      })
    })

    it('reports the recorded payout as settled once the bet settles, but never as claimable', () => {
      const bet = { ...won(REAL_MONEY), isCashedOut: true }

      expect(getBetFigures(bet, DECIMALS)).toEqual({
        totalOdds: 1.5,
        possibleWin: 1.5,
        payout: null,
        settledPayout: 1.5,
      })
    })
  })

  it('formats every figure with the token decimals it is given', () => {
    const decimals = 18
    const bet = placed({
      status: GraphBetStatus.Resolved,
      result: BetResult.Won,
      odds: '1.75',
      settledOdds: '1.75',
      rawAmount: raw('2', decimals),
      rawPotentialPayout: raw('3.5', decimals),
      rawPayout: raw('3.5', decimals),
      isRedeemable: true,
    })

    expect(getBetFigures(bet, decimals)).toEqual({
      totalOdds: 1.75,
      possibleWin: 3.5,
      payout: 3.5,
      settledPayout: 3.5,
    })
    expect(getBetFigures({ ...bet, ...RETURNABLE_FREEBET }, decimals)).toEqual({
      totalOdds: 1.75,
      possibleWin: 1.5,
      payout: 1.5,
      settledPayout: 1.5,
    })
  })
})
