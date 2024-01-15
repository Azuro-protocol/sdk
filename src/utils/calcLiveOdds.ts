import { Selection } from '../global';

type SocketData = {
  id: string
  margin: number
  reinforcement: number
  winningOutcomesCount: number
  outcomes: Array<{
    id: number
    price: number
    clearPrice: number
  }>
}

const ratio = (self: number, other: number): number => (self > other ? self / other : other / self)

const sigmoid = (value: number): number => value / (value + 1)

const getOddsFromProbabilities = (
  probabilities: Record<number, number>,
  margin: number,
  winningOutcomesCount = 1
): Record<number, number> => {
  const precision = 0.0001
  const maxIterations = 10
  const odds: Record<number, number> = {}
  const spreads = Object.keys(probabilities).reduce((acc, outcomeId) => {
    acc[+outcomeId] = (1 - probabilities[+outcomeId]!) * margin

    return acc
  }, {} as Record<number, number>)

  let error = margin

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let oddsSpread: number
    {
      let spread = 0

      Object.keys(probabilities).forEach(outcomeId => {
        const price = (1 - spreads[+outcomeId]!) / probabilities[+outcomeId]!
        odds[+outcomeId] = price
        spread += 1 / price
      })

      oddsSpread = 1 - winningOutcomesCount / spread
    }

    if (ratio(margin, oddsSpread) - 1 < precision) {
      return odds
    }

    if (margin <= oddsSpread) {
      throw new Error('margin <= oddsSpread')
    }

    const newError = margin - oddsSpread

    if (newError === error) {
      if (margin / oddsSpread - 1 >= precision) {
        throw new Error('margin / oddsSpread - 1 >= precision')
      }

      return odds
    }

    error = newError

    Object.keys(spreads).forEach(outcomeId => {
      spreads[+outcomeId] +=
        (1 - spreads[+outcomeId]! - probabilities[+outcomeId]!) *
        sigmoid((error * spreads[+outcomeId]!) / (1 - 1 / odds[+outcomeId]!) / (1 - margin) / oddsSpread)
    })
  }

  throw new Error(
    `Can't calculate odds from given params: ${JSON.stringify(probabilities)} / ${margin} / ${winningOutcomesCount}`
  )
}

type CalcLiveOddsProps = {
  selection: Selection
  betAmount: string
  oddsData: SocketData
}

export const calcLiveOdds = ({ selection, betAmount, oddsData }: CalcLiveOddsProps): number => {
  const { outcomeId: _outcomeId } = selection
  const { margin, reinforcement, winningOutcomesCount, outcomes: _outcomes } = oddsData

  const outcomeId = Number(_outcomeId)

  const outcomes = _outcomes.reduce((acc, { id, price, clearPrice }) => {
    acc[id] = {
      odds: price,
      clearOdds: clearPrice,
    }

    return acc
  }, {} as Record<number, {odds: number, clearOdds: number}>)

  let allFunds = 0

  const funds = Object.keys(outcomes).reduce((acc, outcomeKey) => {
    const { clearOdds } = outcomes[+outcomeKey]!

    const probability = 1 / clearOdds
    let fund = reinforcement * probability

    if (outcomeId === +outcomeKey) {
      fund += Number(betAmount)
    }

    allFunds += fund
    acc[+outcomeKey] = fund

    return acc
  }, {} as Record<number, number>)

  const probabilities = Object.keys(funds).reduce((acc, outcomeKey) => {
    const fund = funds[+outcomeKey]!

    acc[+outcomeKey] = fund / allFunds

    return acc
  }, {} as Record<number, number>)

  const odds = getOddsFromProbabilities(probabilities, margin, winningOutcomesCount)

  if (odds[outcomeId]! > outcomes[outcomeId]!.odds) {
    return outcomes[outcomeId]!.odds
  }

  return odds[outcomeId]!
}
