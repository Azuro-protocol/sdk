import { parseUnits, formatUnits } from '@ethersproject/units'

import { getContract } from '../contracts'
import { USDT_DECIMALS, RATE_DECIMALS } from '../helpers/constants'


type CalculateOddsProps = {
  conditionId: number
  outcomeId: number
  betAmount: number
}

// calculate odds based on actual "fundBank" values
const calculateActualOdds = async ({ conditionId, outcomeId, betAmount }: CalculateOddsProps): Promise<number> => {
  const rawBetAmount = parseUnits(String(betAmount), USDT_DECIMALS)
  const result = await getContract('core').calculateOdds(conditionId, rawBetAmount, outcomeId)
  const odd = formatUnits(result, RATE_DECIMALS)

  return parseFloat(odd)
}

export default calculateActualOdds
