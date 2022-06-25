import { parseUnits, formatUnits } from '@ethersproject/units'

import { getContract } from '../contracts'
import state from '../contracts/state'


type CalculateOddsProps = {
  conditionId: number
  outcomeId: number
  betAmount: number
}

// calculate odds based on actual "fundBank" values
const calculateActualOdds = async ({ conditionId, outcomeId, betAmount }: CalculateOddsProps): Promise<number> => {
  const rawBetAmount = parseUnits(String(betAmount), state.tokenDecimals)
  const result = await getContract('core').calculateOdds(conditionId, rawBetAmount, outcomeId)
  const odd = formatUnits(result, state.rateDecimals)

  return parseFloat(odd)
}

export default calculateActualOdds
