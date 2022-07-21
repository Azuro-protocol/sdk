import type { BigNumber } from 'ethers'

import { getContract, getProvider } from '../contracts'
import calculateInitialOdds from './calculateInitialOdds'
import { ConditionStatus } from '../helpers/enums'
import makeBlockRanges from '../helpers/makeBlockRanges'
import type { ConditionCreatedEvent } from '../contracts/types/Core'


export type ConditionGameData = {
  id: number
  state: ConditionStatus
  startsAt: number
  ipfsHashHex: string
}

export type Condition = {
  id: number
  odds: number[]
  outcomes: number[]
  gameData: ConditionGameData
}

export type Conditions = {
  conditions: Condition[]
  latestBlock: number
}

const _calculateInitialOdds = (fundBank: BigNumber[], margin: BigNumber) => {
  const fundBankSum = fundBank[0].add(fundBank[1]).toString()
  // @ts-ignore
  const funds = fundBank.map((value) => fundBankSum / value.toString())
  // @ts-ignore
  const marginality = margin.toString() / 1e9

  return calculateInitialOdds(funds, marginality)
}

export type FetchConditionsProps = {
  filters?: {
    resolved?: boolean
    canceled?: boolean
  }
  from?: number
  rangeWide?: number
}

const fetchConditions = async (props?: FetchConditionsProps): Promise<Conditions> => {
  const { filters, from, rangeWide } = props || {}
  const { resolved = true, canceled = true } = filters || {}

  const provider = getProvider()
  const coreContract = getContract('core')
  const createdFilter = coreContract.filters.ConditionCreated()

  let events: ConditionCreatedEvent[]

  if (from) {
    const latestBlock = await provider.getBlockNumber()

    const ranges = makeBlockRanges(from, latestBlock, rangeWide)

    events = (await Promise.all(
      ranges.map(([ startBlock, endBlock ]) => (
        coreContract.queryFilter(createdFilter, startBlock, endBlock)
      ))
    )).flat()
  }
  else {
    events = await coreContract.queryFilter(createdFilter, props?.from)
  }

  const conditions = await Promise.all(events.map(async ({ args: { conditionId: rawConditionId } }) => {
    try {
      const id = rawConditionId.toNumber()

      const condition = await coreContract.getCondition(rawConditionId)

      const state = condition.state
      const gameId = condition.scopeId.toNumber()
      const startsAt = condition.timestamp.toNumber() * 1000

      // filter already started games
      if (startsAt <= Date.now()) {
        return
      }

      if (!resolved && state === ConditionStatus.RESOLVED) {
        return
      }

      if (!canceled && state === ConditionStatus.CANCELED) {
        return
      }

      const odds = _calculateInitialOdds(condition.fundBank, condition.margin)
      const outcomes = condition.outcomes.map((value) => value.toNumber())

      return {
        id,
        outcomes,
        odds,
        gameData: {
          id: gameId,
          state,
          startsAt,
          ipfsHashHex: condition.ipfsHash,
        },
      }
    }
    catch (err) {
      console.error(err)
      return null
    }
  }))

  return {
    conditions: conditions.filter(Boolean),
    latestBlock: events.length > 0 ? events[events.length - 1].blockNumber : (props?.from || 0),
  }
}

export default fetchConditions
