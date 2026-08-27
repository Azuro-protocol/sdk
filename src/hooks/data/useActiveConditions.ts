import { useMemo } from 'react'
import {
  type ChainId,
  type ConditionDetailedData,
  type GetConditionsByGameIdsParams,
} from '@azuro-org/toolkit'

import { useConditions, type UseConditionsQueryFnData } from './useConditions'
import { useConditionsState } from '../watch/useConditionsState'
import { useOutcomesState } from '../watch/useOutcomesState'
import { type QueryParameter, type WrapperUseQueryResult } from '../../global'


export type UseActiveConditionsProps = {
  gameId: GetConditionsByGameIdsParams['gameIds']
  /**
   * Keep conditions and outcomes flagged `hidden` in the result.
   *
   * While a game is running, hidden conditions and outcomes are not offered, so they are dropped by
   * default. Once the game is over they become part of the result the bettor should see, so
   * finished and canceled games should pass `true`.
   * */
  includeHidden?: boolean
  /** To receive new conditions ("5...") that are not in the "dictionaries" package (managed via API only) */
  extended?: boolean
  chainId?: ChainId
  query?: QueryParameter<UseConditionsQueryFnData>
}

export type UseActiveConditionsResult = WrapperUseQueryResult<UseConditionsQueryFnData | undefined, UseConditionsQueryFnData>

export type UseActiveConditions = (props: UseActiveConditionsProps) => UseActiveConditionsResult

const emptyConditions: ConditionDetailedData[] = []

/**
 * Fetch the conditions a game currently offers. Wraps `useConditions` hook.
 *
 * Conditions and outcomes flagged `hidden` are dropped, which is what a running game should show.
 * Pass `includeHidden` to keep them, e.g. for a finished game. A condition left with no visible
 * outcome is dropped too, having nothing left to offer.
 *
 * Visibility is decided on the live value rather than the fetched one, and only after every
 * condition of the game has been subscribed: the feed sends no updates for a condition that was not
 * subscribed, so a condition dropped any earlier could never be revealed again. Visibility is
 * latched one way - a market that stops stays in the list, locked, and a market hidden at fetch time
 * is revealed at most once - so the list doesn't reflow while a bettor is reading it.
 *
 * Requires `FeedSocketProvider` and `ConditionUpdatesProvider` (both are included in
 * `AzuroSDKProvider`). Because the filtering happens after the query, `query.select` isn't
 * supported - it would run before it. Use `useConditions` if you need one.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useActiveConditions
 *
 * @example
 * import { useActiveConditions } from '@azuro-org/sdk'
 *
 * // gameData from useGames() or useGame()
 * const gameId = gameData.gameId
 * const { data, isFetching } = useActiveConditions({ gameId })
 *
 * // the game is over - show everything, including what was hidden while it ran
 * const { data: allConditions } = useActiveConditions({ gameId, includeHidden: true })
 * */
export const useActiveConditions: UseActiveConditions = (props) => {
  const { gameId, chainId, extended, includeHidden, query } = props

  const { data: conditions, ...queryResult } = useConditions<UseConditionsQueryFnData>({
    gameId,
    chainId,
    extended,
    query,
  })

  // everything the game has is subscribed, hidden conditions included - see the note above
  const { conditionsMap } = useConditionsState({ conditions: conditions ?? emptyConditions })

  const outcomes = useMemo(() => (
    (conditions ?? emptyConditions).flatMap(({ conditionId, outcomes }) => (
      outcomes.map(({ outcomeId, odds, state, hidden }) => ({
        conditionId,
        outcomeId,
        odds: +odds,
        state,
        hidden,
      }))
    ))
  ), [ conditions ])

  const { outcomesMap } = useOutcomesState({ outcomes })

  // both maps are replaced on every socket message, most of which are odds updates. Collapse the
  // part of them that can change the result into a comparable key, so the filtering below - and
  // everything downstream of it - only reruns when visibility actually moved.
  const visibilityKey = useMemo(() => (
    (conditions ?? emptyConditions).reduce((acc, { conditionId, outcomes }) => {
      acc += conditionsMap[conditionId]?.hidden ? '1' : '0'

      outcomes.forEach(({ outcomeId }) => {
        acc += outcomesMap[`${conditionId}-${outcomeId}`]?.hidden ? '1' : '0'
      })

      return acc
    }, '')
  ), [ conditions, conditionsMap, outcomesMap ])

  const data = useMemo(() => {
    if (!conditions || includeHidden) {
      return conditions
    }

    return conditions.reduce<UseConditionsQueryFnData>((acc, condition) => {
      const { conditionId, outcomes } = condition

      if (conditionsMap[conditionId]?.hidden) {
        return acc
      }

      const visibleOutcomes = outcomes.filter(({ outcomeId }) => (
        !outcomesMap[`${conditionId}-${outcomeId}`]?.hidden
      ))

      // a condition whose every outcome is hidden has nothing left to offer
      if (!visibleOutcomes.length) {
        return acc
      }

      acc.push(visibleOutcomes.length === outcomes.length ? condition : { ...condition, outcomes: visibleOutcomes })

      return acc
    }, [])
    // the maps are read through `visibilityKey` on purpose - they change identity far more often
    // than they change the outcome of this filter
  }, [ conditions, includeHidden, visibilityKey ])

  return {
    ...queryResult,
    data,
  }
}
