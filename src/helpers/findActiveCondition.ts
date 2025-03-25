import { ConditionState, type GameMarkets } from '@azuro-org/toolkit'


type Props = {
  states: Record<string, ConditionState>
  marketsByKey: Record<string, GameMarkets[0]>
  sortedMarketKeys: string[]
  activeMarketKey: string
}

export const findActiveCondition = ({ states, marketsByKey, sortedMarketKeys, activeMarketKey }: Props) => {
  // try to find condition with Created status in active market
  let nextConditionIndex = marketsByKey[activeMarketKey!]!.conditions.findIndex(({ conditionId }) => {
    return states[conditionId] === ConditionState.Active
  })

  if (nextConditionIndex !== -1) {
    return {
      nextMarketKey: activeMarketKey,
      nextConditionIndex,
    }
  }
  else {
    // try to find next market and condition with Created status
    nextConditionIndex = 0

    const nextMarketKey = sortedMarketKeys.find(marketKey => {
      return marketsByKey[marketKey]!.conditions.find(({ conditionId }, index) => {
        const isMatch = states[conditionId] === ConditionState.Active

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
