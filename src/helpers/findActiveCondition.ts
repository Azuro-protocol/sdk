import { ConditionState, isOutcomeSettled, type GameMarkets, type MarketCondition } from '@azuro-org/toolkit'


type Props = {
  states: Record<string, ConditionState>
  marketsByKey: Record<string, GameMarkets[0]>
  sortedMarketKeys: string[]
  activeMarketKey: string
}

/**
 * Resolution is per-outcome, so a condition can keep reporting `ConditionState.Active` after every
 * one of its outcomes has been won, lost or voided. Such a condition has nothing left to bet on and
 * must not be picked as the active market.
 * */
export const getIsConditionActive = (condition: MarketCondition, states: Record<string, ConditionState>) => {
  if (states[condition.conditionId] !== ConditionState.Active) {
    return false
  }

  const { outcomes } = condition

  return !outcomes?.length || outcomes.some(({ state }) => !isOutcomeSettled(state))
}

export const findActiveCondition = ({ states, marketsByKey, sortedMarketKeys, activeMarketKey }: Props) => {
  // try to find an active condition in active market
  let nextConditionIndex = marketsByKey[activeMarketKey!]!.conditions.findIndex((condition) => {
    return getIsConditionActive(condition, states)
  })

  if (nextConditionIndex !== -1) {
    return {
      nextMarketKey: activeMarketKey,
      nextConditionIndex,
    }
  }
  else {
    // try to find next market and an active condition in it
    nextConditionIndex = 0

    const nextMarketKey = sortedMarketKeys.find(marketKey => {
      return marketsByKey[marketKey]!.conditions.find((condition, index) => {
        const isMatch = getIsConditionActive(condition, states)

        if (isMatch) {
          nextConditionIndex = index
        }

        return isMatch
      })
    })

    if (nextMarketKey) {
      return {
        nextMarketKey,
        nextConditionIndex,
      }
    }

    return {}
  }
}
