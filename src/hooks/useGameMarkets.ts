import { useMemo } from 'react'
import { dictionaries, getMarketKey, getMarketName, getMarketDescription, getSelectionName } from '@azuro-org/dictionaries'
import { type ConditionsQuery } from '../docs/conditions'
import { useConditions } from './useConditions'
import { ConditionStatus } from 'src/types'
import { Selection } from '../global';


export type Condition = {
  conditionId: string | bigint
}

export type MarketOutcome = {
  selectionName: string
  odds: string
  lpAddress: string
  coreAddress: string
  status: ConditionStatus
} & Selection

export type Market = {
  name: string
  description: string
  outcomes: MarketOutcome[][]
}

const groupDataByConditionId = <T extends Condition>(data: T[]): Record<string, T[]> => {
  return data.reduce<Record<string, T[]>>((acc, item) => {
    const { conditionId } = item
    const key = String(conditionId)

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key]!.push(item)

    return acc
  }, {})
}

type OutcomesByMarkets = Record<string, MarketOutcome[]>
type OutcomeRowsByMarket = Record<string, Market>

export type GameMarkets = Market[]

const groupMarkets = (conditions: ConditionsQuery['conditions']): GameMarkets => {
  const outcomesByMarkets: OutcomesByMarkets = {}
  const result: OutcomeRowsByMarket = {}

  conditions.forEach(({ conditionId, outcomes: rawOutcomes, core, status }) => {
    rawOutcomes.forEach(({ outcomeId, odds }) => {
      const marketKey = getMarketKey(outcomeId)
      const marketName = getMarketName({ outcomeId })
      const marketDescription = getMarketDescription({ outcomeId })
      const selectionName = getSelectionName({ outcomeId, withPoint: true })

      const outcome: MarketOutcome = {
        coreAddress: core.address,
        lpAddress: core.liquidityPool.address,
        conditionId,
        outcomeId,
        selectionName,
        odds,
        status,
      }

      if (!outcomesByMarkets[marketKey]) {
        outcomesByMarkets[marketKey] = []

        result[marketKey] = {
          name: marketName,
          description: marketDescription,
          outcomes: [],
        }
      }

      outcomesByMarkets[marketKey]!.push(outcome)
    })
  })

  // markets with different conditionIds
  const marketsWithDifferentConditionIds = [ '1', '2' ]

  // sort by outcomeId and group by conditionId
  Object.keys(outcomesByMarkets).forEach((marketKey) => {
    const marketId = marketKey.split('-')[0]!
    // get the conditions related to the market
    const outcomes = outcomesByMarkets[marketKey]!

    const validSelectionsByMarketId: Record<string, number[]> = {
      '1': [ 1, 2, 3 ],
      '2': [ 4, 5, 6 ],
    }

    const validSelections = validSelectionsByMarketId[marketId]

    if (validSelections?.length) {
      const outcomesSelections = outcomes.map((outcome) => (
        dictionaries.outcomes[String(outcome.outcomeId)]!.selectionId
      ))

      const isValid = validSelections.every(selection => outcomesSelections.includes(selection))

      if (!isValid) {
        return
      }
    }

    // sort the conditions by selectionId
    outcomes.sort((a, b) => {
      const { outcomes: dictionaryOutcomes } = dictionaries
      const left = dictionaryOutcomes[String(a.outcomeId)]!.selectionId
      const right = dictionaryOutcomes[String(b.outcomeId)]!.selectionId

      return left - right
    })

    // these markets have few outcomes and not requires additional actions
    if (marketsWithDifferentConditionIds.includes(marketId)) {
      result[marketKey]!.outcomes = [ outcomes ]
    }
      // others need to be grouped by conditionId to allow draw outcomes in rows in UI, e.g.
      //
      // Team 1 - Total Goals:
      // Over (0.5)   Under (0.5)
      // Over (1.5)   Under (1.5)
    //
    else {
      const conditionsByConditionId = groupDataByConditionId<MarketOutcome>(outcomes)

      result[marketKey]!.outcomes = Object.values(conditionsByConditionId).sort((a, b) => {
        const { points, outcomes: dictionaryOutcomes } = dictionaries
        /*
          we should always sort by param in first outcome

          Handicap
          Team 1 (-2.5)   Team 2 (2.5)
          Team 1 (-1.5)   Team 2 (1.5)

          Total Goals
          Over (1.5)   Under (1.5)
          Over (2.5)   Under (2.5)
        */
        const aPointId = dictionaryOutcomes[String(a[0]!.outcomeId)]!.pointsId!
        const bPointId = dictionaryOutcomes[String(b[0]!.outcomeId)]!.pointsId!
        const aFirstOutcome = +points[aPointId]!
        const bFirstOutcome = +points[bPointId]!

        return aFirstOutcome - bFirstOutcome
      })
    }
  })

  return Object.values(result)
}

type Props = {
  gameId: string | bigint
  filter?: {
    outcomeIds?: string[]
  }
}

export const useGameMarkets = (props: Props) => {
  const { gameId, filter } = props

  const { loading, data, error } = useConditions({
    gameId,
    filter,
  })

  // generate unique key for memo deps
  const conditionIds = data?.conditions.map(({ id, outcomes }) => `${id}-${outcomes.length}`).join('')

  const markets = useMemo(() => {
    if (!data) {
      return undefined
    }

    if (!data.conditions) {
      return null
    }

    return groupMarkets(data?.conditions)
  }, [ conditionIds ])

  return {
    loading,
    data: markets,
    error,
  }
}
