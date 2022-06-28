import { parseUnits } from '@ethersproject/units'

import { getContract, getTokenDecimals, getRateDecimals } from '../contracts'


type PlaceBetProps = {
  conditionId: number
  outcomeId: number
  amount: number
  betRate: number
  slippage: number
}

export const placeBet = async (props: PlaceBetProps) => {
  const { conditionId, outcomeId, amount, betRate, slippage } = props

  const lpContract = getContract('lp', true)

  const rawAmount = parseUnits(String(amount), await getTokenDecimals())
  const minRate = (1 + (betRate - 1) * (100 - slippage) / 100).toFixed(8)
  const rawMinRate = parseUnits(minRate, await getRateDecimals())
  // TODO remove this - added on 12/12/21 by pavelivanov
  const deadline = Math.floor(Date.now() / 1000) + 2000

  return lpContract.bet(
    conditionId,
    rawAmount,
    outcomeId,
    deadline,
    rawMinRate
  )
}

export default placeBet
