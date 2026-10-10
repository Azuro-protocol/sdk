import { describe, expect, it } from 'vitest'
import { formatUnits } from 'viem'
import { type BettorFragment } from '@azuro-org/toolkit'

import { type PatchBettorRowsProps, patchBettorRows } from './patchBettorRows'


const DECIMALS = 6

const LP = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const ACCOUNT = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const AFFILIATE = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const SECOND_AFFILIATE = '0xcccccccccccccccccccccccccccccccccccccccc'
const THIRD_AFFILIATE = '0xdddddddddddddddddddddddddddddddddddddddd'

const makeRow = (affiliate: string, values: Partial<BettorFragment> = {}): BettorFragment => ({
  id: `${LP}_${ACCOUNT}_${affiliate}`,
  affiliate,
  rawToPayout: '0',
  rawInBets: '0',
  rawTotalPayout: '0',
  rawTotalProfit: '0',
  betsCount: 0,
  wonBetsCount: 0,
  lostBetsCount: 0,
  canceledBetsCount: 0,
  cashedOutBetsCount: 0,
  freebetBetsCount: 0,
  freebetWonBetsCount: 0,
  freebetLostBetsCount: 0,
  freebetCanceledBetsCount: 0,
  rawFreebetTurnover: '0',
  rawFreebetInBets: '0',
  rawFreebetToPayout: '0',
  rawFreebetTotalPayout: '0',
  ...values,
})

const makeBet = (values: Partial<PatchBettorRowsProps['bet']> = {}): PatchBettorRowsProps['bet'] => ({
  lpAddress: LP,
  affiliate: AFFILIATE,
  amount: '3',
  settledPayout: null,
  freebetId: null,
  isCanceled: false,
  ...values,
})

describe('patchBettorRows', () => {
  it('lowers rawToPayout by the payout when a won real-money bet is redeemed', () => {
    const row = makeRow(AFFILIATE, { rawToPayout: '5000000', betsCount: 2 })

    const { rows, isMatched } = patchBettorRows({
      rows: [ row ],
      account: ACCOUNT,
      bet: makeBet({ amount: '3', settledPayout: 4.5 }),
      action: 'redeem',
      decimals: DECIMALS,
    })

    expect(isMatched).toBe(true)
    expect(rows[0]).toEqual({ ...row, rawToPayout: '500000' })
  })

  it('lowers rawToPayout by the stake when a canceled real-money bet is redeemed', () => {
    const row = makeRow(AFFILIATE, { rawToPayout: '5000000' })

    const { rows } = patchBettorRows({
      rows: [ row ],
      account: ACCOUNT,
      bet: makeBet({ amount: '3', isCanceled: true }),
      action: 'redeem',
      decimals: DECIMALS,
    })

    expect(rows[0]).toEqual({ ...row, rawToPayout: '2000000' })
  })

  it('lowers only rawFreebetToPayout, by the bettor share, when a freebet is redeemed', () => {
    // a returnable 1.00 freebet won at 1.50 pays the bettor 0.50
    const row = makeRow(AFFILIATE, { rawToPayout: '5000000', rawFreebetToPayout: '2000000' })

    const { rows } = patchBettorRows({
      rows: [ row ],
      account: ACCOUNT,
      bet: makeBet({ freebetId: '1', amount: '1', settledPayout: 0.5 }),
      action: 'redeem',
      decimals: DECIMALS,
    })

    expect(rows[0]).toEqual({ ...row, rawFreebetToPayout: '1500000' })
  })

  it('takes the stake out of rawInBets and counts the cash-out, keeping betsCount', () => {
    const row = makeRow(AFFILIATE, {
      rawInBets: '10000000',
      rawToPayout: '5000000',
      betsCount: 4,
      cashedOutBetsCount: 1,
    })

    const { rows } = patchBettorRows({
      rows: [ row ],
      account: ACCOUNT,
      bet: makeBet({ amount: '3' }),
      action: 'cashout',
      decimals: DECIMALS,
    })

    expect(rows[0]).toEqual({ ...row, rawInBets: '7000000', cashedOutBetsCount: 2 })
  })

  it('changes only the row of the bet affiliate when one pool has rows for two affiliates', () => {
    const first = makeRow(AFFILIATE, { rawToPayout: '5000000' })
    const second = makeRow(SECOND_AFFILIATE, { rawToPayout: '5000000' })

    const { rows, isMatched } = patchBettorRows({
      rows: [ first, second ],
      account: ACCOUNT,
      bet: makeBet({ affiliate: SECOND_AFFILIATE, settledPayout: 4.5 }),
      action: 'redeem',
      decimals: DECIMALS,
    })

    expect(isMatched).toBe(true)
    expect(rows[0]).toBe(first)
    expect(rows[1]).toEqual({ ...second, rawToPayout: '500000' })
  })

  it('leaves the rows untouched when no row belongs to the bet affiliate', () => {
    const initialRows = [ makeRow(AFFILIATE, { rawToPayout: '5000000' }), makeRow(SECOND_AFFILIATE) ]

    const { rows, isMatched } = patchBettorRows({
      rows: initialRows,
      account: ACCOUNT,
      bet: makeBet({ affiliate: THIRD_AFFILIATE, settledPayout: 4.5 }),
      action: 'redeem',
      decimals: DECIMALS,
    })

    expect(isMatched).toBe(false)
    expect(rows).toBe(initialRows)
    expect(rows[0]!.rawToPayout).toBe('5000000')
  })

  it('matches the row id whatever the case of the addresses', () => {
    const row = makeRow(AFFILIATE, { rawToPayout: '5000000' })

    const { rows, isMatched } = patchBettorRows({
      rows: [ row ],
      account: '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa',
      bet: makeBet({
        lpAddress: '0xEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEe',
        affiliate: '0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb',
        settledPayout: 4.5,
      }),
      action: 'redeem',
      decimals: DECIMALS,
    })

    expect(isMatched).toBe(true)
    expect(rows[0]!.rawToPayout).toBe('500000')
  })

  it('stops a figure at zero when the debit is larger than the row holds', () => {
    const row = makeRow(AFFILIATE, { rawToPayout: '1000000' })

    const { rows } = patchBettorRows({
      rows: [ row ],
      account: ACCOUNT,
      bet: makeBet({ settledPayout: 4.5 }),
      action: 'redeem',
      decimals: DECIMALS,
    })

    expect(rows[0]!.rawToPayout).toBe('0')
  })

  it('accepts a payout too small to be written in fixed notation by String()', () => {
    const row = makeRow(AFFILIATE, { rawToPayout: '1000000' })

    const { rows } = patchBettorRows({
      rows: [ row ],
      account: ACCOUNT,
      bet: makeBet({ settledPayout: 1e-7 }),
      action: 'redeem',
      decimals: DECIMALS,
    })

    expect(rows[0]!.rawToPayout).toBe('1000000')
  })

  it('leaves no dust when the last payout of an 18-decimal row is redeemed and the number rounds down', () => {
    // 1.5000000000000001 has no exact number, so the cached payout reads 1.5, 100 base units short
    const rawPayout = 1500000000000000100n
    const row = makeRow(AFFILIATE, { rawToPayout: String(rawPayout) })

    const { rows } = patchBettorRows({
      rows: [ row ],
      account: ACCOUNT,
      bet: makeBet({ settledPayout: +formatUnits(rawPayout, 18) }),
      action: 'redeem',
      decimals: 18,
    })

    expect(rows[0]!.rawToPayout).toBe('0')
  })
})
