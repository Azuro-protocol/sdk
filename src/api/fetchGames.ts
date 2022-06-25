import { utils } from 'ethers'

import fetchGameIpfsData, { FormattedIpfsData } from './fetchGameIpfsData'
import fetchConditions from './fetchConditions'
import type { FetchConditionsProps, ConditionGameData } from './fetchConditions'
import betTypeOdd from '../helpers/betTypeOdd'


/*

  first of all we store all conditions without odds in one map by "{conditionId}" key.

  after we store all odds in other map by "{gameId}-{marketRegistryId}" key. Each odd contains "conditionId" reference
  to find related condition in conditions map.

  ---

  betVariant - one from "odds" that doesn't have pair, it's just an entity with params describing bet itself
  odds - group of betVariants related to one "condition"

 */

type Odds = {
  conditionId: number
  outcomeId: number
  outcomeRegistryId: number
  value: number
}

type BetVariant = {
  conditionId: number
  outcomeId: number
  outcomeRegistryId: number
  paramId: number | null
  value: number
}

type GameBets = Record<string, {
  gameId: number
  marketRegistryId: number
  betVariants: BetVariant[]
}>

let gamesInfo = {}
let gameBets: GameBets = {}

const groupBetVariants = (oddsArr: (BetVariant & { paramId: number })[]): Record<number, Odds[]> => {
  const group = {}

  oddsArr.forEach((odds) => {
    if (!group[odds.paramId]) {
      group[odds.paramId] = []
    }

    group[odds.paramId].push(odds)
  })

  return group
}

type GroupGamesResult = ConditionGameData & {
  marketRegistryId: number
  conditions: {
    paramId: number
    odds: Odds[]
  }[]
}

const groupGames = (): GroupGamesResult[] => {
  return Object.keys(gameBets).map((key) => {
    const { gameId, marketRegistryId, betVariants } = gameBets[key]

    const groupedBetVariants = groupBetVariants(betVariants)

    let conditions: GroupGamesResult['conditions']

    const paramIds = Object.keys(groupedBetVariants)

    if (paramIds.length === 1) {
      const odds = groupedBetVariants[paramIds[0]].sort((a, b) => a.outcomeId - b.outcomeId)

      conditions = [ { paramId: null, odds } ]
    }
    else {
      conditions = Object.keys(groupedBetVariants).map((paramId) => ({
        paramId: parseInt(paramId),
        odds: groupedBetVariants[paramId].sort((a, b) => b.outcomeId - a.outcomeId),
      }))
    }

    return {
      ...gamesInfo[gameId],
      conditions,
      marketRegistryId,
    }
  })
}

type GetOddsByOutcomesProps = {
  gameId: number
  conditionId: number
  outcomes: number[]
  odds: number[]
}

const groupOddsByOutcomes = (values: GetOddsByOutcomesProps) => {
  const { gameId, conditionId, outcomes, odds } = values

  return outcomes.map((outcomeId, index) => {
    const value = odds[index]

    if (!betTypeOdd[outcomeId]) {
      console.warn(`Unknown outcomeId ${outcomeId}. Please update the Azuro SDK version`)
      return
    }

    const { outcomeRegistryId, marketRegistryId, paramId } = betTypeOdd[outcomeId]

    const key = `${gameId}-${marketRegistryId}`

    if (!gameBets[key]) {
      gameBets[key] = {
        gameId,
        marketRegistryId,
        betVariants: [],
      }
    }

    const betVariant: Odds & { paramId: number } = {
      conditionId,
      outcomeId,
      outcomeRegistryId,
      paramId,
      value,
    }

    gameBets[key].betVariants.push(betVariant)
  })
}

type FetchGamesProps = FetchConditionsProps

export type Game = Omit<GroupGamesResult, 'ipfsHashHex'> & FormattedIpfsData;

const fetchGames = async (props: FetchGamesProps = {}): Promise<Game[]> => {
  gamesInfo = {}
  gameBets = {}

  const conditions = await fetchConditions(props)

  conditions.forEach((condition) => {
    const { id, outcomes, odds, gameData } = condition

    gamesInfo[gameData.id] = gameData

    groupOddsByOutcomes({
      gameId: gameData.id,
      conditionId: id,
      outcomes,
      odds,
    })
  })

  const games = groupGames()

  const result = await Promise.all(games.map(async (game) => {
    try {
      const { ipfsHashHex, ...rest } = game

      const ipfsHashArr = utils.arrayify(ipfsHashHex)
      const ipfsHash = utils.base58.encode([ 18, 32, ...ipfsHashArr ])
      const gameData = await fetchGameIpfsData(ipfsHash)

      if (!gameData) {
        return null
      }

      return {
        ...gameData,
        ...rest,
      }
    }
    catch (err) {
      console.error(err)
      return null
    }
  }))

  return result.filter(Boolean).sort((a, b) => a.startsAt - b.startsAt)
}

export default fetchGames
