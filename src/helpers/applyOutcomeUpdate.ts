import { ConditionState, type OutcomeState } from '@azuro-org/toolkit'

import { latchHidden } from './latchHidden'
import { type OutcomeUpdateData } from '../contexts/conditionUpdates'


/**
 * Current known values for an outcome. The wire type `OutcomeUpdateData` also carries the state of
 * the condition the update arrived on, which says how much of it can be trusted - that is applied
 * by `applyOutcomeUpdate` rather than handed on.
 * */
export type OutcomeStateData = {
  odds: number
  turnover: string
  state: OutcomeState
  /** `undefined` until the feed has reported it */
  hidden?: boolean
}

/**
 * Fold a socket update into the values known for an outcome.
 *
 * `odds` and `turnover` are real in every update. `state` and `hidden` are only meaningful when the
 * condition the update arrived on is `Active`: an update for an inactive condition reports every one
 * of its outcomes as `Stopped`, whatever they had actually settled to. Such an update therefore
 * keeps the previous state and visibility, and returns `undefined` when there is no previous value
 * to keep - nothing about it is trustworthy enough to write, and the caller re-reads the outcome
 * from the state endpoint instead.
 *
 * Visibility is latched one way, so a revealed outcome stays revealed.
 * */
export const applyOutcomeUpdate = (prevValue: OutcomeStateData | undefined, update: OutcomeUpdateData) => {
  const { odds, turnover, state, hidden, conditionState } = update

  if (conditionState !== ConditionState.Active) {
    if (!prevValue) {
      return undefined
    }

    return {
      ...prevValue,
      odds,
      turnover,
    }
  }

  return {
    odds,
    turnover,
    state,
    hidden: latchHidden(prevValue?.hidden, hidden),
  }
}
