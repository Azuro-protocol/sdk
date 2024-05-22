import { ODDS_DECIMALS } from '../config'


type CalcMindOddsProps = {
  odds: number | number[]
  slippage: number
}

export const calcMindOdds = (props: CalcMindOddsProps) => {
  const totalOdds = typeof props.odds === 'number' ? props.odds : props.odds.reduce((acc, odds) => acc * +odds, 1)
  const minOdds = 1 + (totalOdds - 1) * (100 - props.slippage) / 100

  return parseFloat(String(minOdds)).toFixed(ODDS_DECIMALS)
}
