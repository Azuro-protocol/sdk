import { ConditionStatus, type GameMarkets } from '@azuro-org/toolkit'


type Props = {
  statuses: Record<string, ConditionStatus>
  marketsByKey: Record<string, GameMarkets[0]>
  sortedMarketKeys: string[]
  activeMarketKey: string
}

export const findActiveCondition = ({ statuses, marketsByKey, sortedMarketKeys, activeMarketKey }: Props) => {
  // try to find condition with Created status in active market
  let nextConditionIndex = marketsByKey[activeMarketKey!]!.outcomeRows.findIndex((outcomes) => {
    return outcomes.some(({ conditionId }) => statuses[conditionId] === ConditionStatus.Created)
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
      return marketsByKey[marketKey]!.outcomeRows.find((outcomes, index) => {
        const isMatch = statuses[outcomes[0]!.conditionId] === ConditionStatus.Created

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
