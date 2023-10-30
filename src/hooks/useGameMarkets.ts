import { useMemo } from 'react'
import { dictionaries, getMarketKey, getMarketName, getMarketDescription, getSelectionName } from '@azuro-org/dictionaries'
import { type ConditionsQuery } from '../docs/conditions'
import { useConditions } from './useConditions'
import { ConditionStatus } from 'src/types'


export type Condition = {
  conditionId: string
}

export type Outcome = {
  conditionId: string
  outcomeId: string
  selectionName: string
  odds: string
  lpAddress: string
  coreAddress: string
  status: ConditionStatus
}

export type Market = {
  name: string
  description: string
  selections: Outcome[][]
}

const groupDataByConditionId = <T extends Condition>(data: T[]): Record<string, T[]> => {
  return data.reduce<Record<string, T[]>>((acc, item) => {
    const { conditionId } = item

    if (!acc[conditionId]) {
      acc[conditionId] = []
    }

    acc[conditionId]!.push(item)

    return acc
  }, {})
}

type SelectionsByMarkets = Record<string, Outcome[]>
type SelectionRowsByMarket = Record<string, Market>

export type GameMarkets = Market[]

const groupMarkets = (conditions: ConditionsQuery['conditions']): GameMarkets => {
  const selectionsByMarkets: SelectionsByMarkets = {}
  const result: SelectionRowsByMarket = {}

  conditions.forEach(({ conditionId, outcomes, core, status }) => {
    outcomes.forEach(({ outcomeId, odds }) => {
      const marketKey = getMarketKey(outcomeId)
      const marketName = getMarketName({ outcomeId })
      const marketDescription = getMarketDescription({ outcomeId })
      const selectionName = getSelectionName({ outcomeId, withPoint: true })

      const selection: Outcome = {
        coreAddress: core.address,
        lpAddress: core.liquidityPool.address,
        conditionId,
        outcomeId,
        selectionName,
        odds,
        status,
      }

      if (!selectionsByMarkets[marketKey]) {
        selectionsByMarkets[marketKey] = []

        result[marketKey] = {
          name: marketName,
          description: marketDescription,
          selections: [],
        }
      }

      selectionsByMarkets[marketKey]!.push(selection)
    })
  })

  // markets with different conditionIds
  const marketsWithDifferentConditionIds = [ '1', '2' ]

  // sort by outcomeId and group by conditionId
  Object.keys(selectionsByMarkets).forEach((marketKey) => {
    const marketId = marketKey.split('-')[0]!
    // get the conditions related to the market
    const selections = selectionsByMarkets[marketKey]!

    const validSelectionsByMarketId: Record<string, number[]> = {
      '1': [ 1, 2, 3 ],
      '2': [ 4, 5, 6 ],
    }

    const validSelections = validSelectionsByMarketId[marketId]

    if (validSelections?.length) {
      const outcomesSelections = selections.map((outcome) => (
        dictionaries.outcomes[outcome.outcomeId]!.selectionId
      ))

      const isValid = validSelections.every(selection => outcomesSelections.includes(selection))

      if (!isValid) {
        return
      }
    }

    // sort the conditions by selectionId
    selections.sort((a, b) => {
      const { outcomes } = dictionaries
      const left = outcomes[a.outcomeId]!.selectionId
      const right = outcomes[b.outcomeId]!.selectionId

      return left - right
    })

    // these markets have few outcomes and not requires additional actions
    if (marketsWithDifferentConditionIds.includes(marketId)) {
      result[marketKey]!.selections = [ selections ]
    }
      // others need to be grouped by conditionId to allow draw outcomes in rows in UI, e.g.
      //
      // Team 1 - Total Goals:
      // Over (0.5)   Under (0.5)
      // Over (1.5)   Under (1.5)
    //
    else {
      const conditionsByConditionId = groupDataByConditionId<Outcome>(selections)

      result[marketKey]!.selections = Object.values(conditionsByConditionId).sort((a, b) => {
        const { points, outcomes } = dictionaries
        /*
          we should always sort by param in first outcome

          Handicap
          Team 1 (-2.5)   Team 2 (2.5)
          Team 1 (-1.5)   Team 2 (1.5)

          Total Goals
          Over (1.5)   Under (1.5)
          Over (2.5)   Under (2.5)
        */
        const aPointId = outcomes[a[0]!.outcomeId]!.pointsId!
        const bPointId = outcomes[b[0]!.outcomeId]!.pointsId!
        const aFirstOutcome = +points[aPointId]!
        const bFirstOutcome = +points[bPointId]!

        return aFirstOutcome - bFirstOutcome
      })
    }
  })

  return Object.values(result)
}

type Props = {
  gameId: string
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
    markets,
    error,
  }
}
