import { parseUnits, formatUnits } from '@ethersproject/units'

import { getContract, getTokenDecimals, getRateDecimals } from '../contracts'


type CalculateOddsProps = {
  conditionId: number
  outcomeId: number
  betAmount: number
}

// calculate odds based on actual "fundBank" values
const calculateActualOdds = async ({ conditionId, outcomeId, betAmount }: CalculateOddsProps): Promise<number> => {
  const rawBetAmount = parseUnits(String(betAmount), await getTokenDecimals())
  const result = await getContract('core').calculateOdds(conditionId, rawBetAmount, outcomeId)
  const odd = formatUnits(result, await getRateDecimals())

  return parseFloat(odd)
}

export default calculateActualOdds
