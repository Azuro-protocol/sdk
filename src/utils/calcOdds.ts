import { readContract } from '@wagmi/core'
import { type Config } from 'wagmi'
import { type Address, formatUnits, parseUnits } from 'viem'

import { type ChainId, ODDS_DECIMALS, chainsData } from '../config'
import type { Selection } from '../global'
import { formatToFixed } from '../helpers/formatToFixed'
import { prematchComboCoreAbi, prematchCoreAbi } from '../abis'


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

type OddsData = {
  conditionId: string
  margin: number
  reinforcement: number
  winningOutcomesCount: number
  outcomes: Record<string, {
    odds: number
    clearOdds: number
  }>
}

type CalcLiveOddsProps = {
  selection: Selection
  betAmount: string
  oddsData: OddsData
}

export const calcLiveOdds = ({ selection, betAmount, oddsData }: CalcLiveOddsProps): number => {
  const { outcomeId: _outcomeId } = selection
  const { margin, reinforcement, winningOutcomesCount, outcomes } = oddsData

  const outcomeId = Number(_outcomeId)

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

  return formatToFixed(odds[outcomeId]!, 2)
}


type CalcPrematchOddsProps = {
  config: Config
  betAmount: string
  selections: Selection[]
  chainId: ChainId
  isBatch?: boolean
}

export const calcPrematchOdds = async (props: CalcPrematchOddsProps): Promise<Record<string, number>> => {
  const { config, selections, betAmount, chainId, isBatch } = props

  const { betToken, contracts } = chainsData[chainId]
  const rawAmount = parseUnits(betAmount, betToken.decimals)

  if (selections.length === 1 || isBatch) {
    let odds: Record<string, number> = {}

    for (let index = 0; index < selections.length; index++) {
      const { conditionId, outcomeId, coreAddress } = selections[index]!

      try {
        const rawOdds = await readContract(config, {
          abi: prematchCoreAbi,
          address: coreAddress as Address,
          chainId,
          functionName: 'calcOdds',
          args: [ BigInt(conditionId), rawAmount, BigInt(outcomeId) ],
        })

        odds[`${conditionId}-${outcomeId}`] = formatToFixed(formatUnits(rawOdds, ODDS_DECIMALS), 3)
      }
      catch {}
    }

    return odds
  }

  if (selections.length > 1) {
    const expressAddress = contracts.prematchComboCore.address

    const subBets = selections.map(({ conditionId, outcomeId }) => ({
      conditionId: BigInt(conditionId),
      outcomeId: BigInt(outcomeId),
    }))

    try {
      const [ conditionOdds ] = await readContract(config, {
        abi: prematchComboCoreAbi,
        address: expressAddress as Address,
        chainId,
        functionName: 'calcOdds',
        args: [ subBets, rawAmount ],
      })

      return selections.reduce((acc, { conditionId, outcomeId }, index) => {
        const key = `${conditionId}-${outcomeId}`

        acc[key] = formatToFixed(formatUnits(conditionOdds[index]!, ODDS_DECIMALS), 3)

        return acc
      }, {} as Record<string, number>)
    }
    catch {}
  }

  return {}
}
