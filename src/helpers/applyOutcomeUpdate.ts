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
  /** `undefined` until an update that can be trusted for it, or a state read, has reported it */
  state?: OutcomeState
  /** `undefined` until the feed has reported it */
  hidden?: boolean
}

/**
 * Fold a socket update into the values known for an outcome.
 *
 * `odds` and `turnover` are real in every update and are always taken. `state` and `hidden` are only
 * meaningful when the condition the update arrived on is `Active`: an update for an inactive
 * condition reports every one of its outcomes as `Stopped`, whatever they had actually settled to.
 * Such an update therefore keeps the state and visibility already known, and leaves them unreported
 * when nothing is known yet - the caller re-reads them from the state endpoint, which is
 * authoritative, and shows the odds meanwhile.
 *
 * Visibility is latched one way, so a revealed outcome stays revealed.
 * */
export const applyOutcomeUpdate = (prevValue: OutcomeStateData | undefined, update: OutcomeUpdateData): OutcomeStateData => {
  const { odds, turnover, state, hidden, conditionState } = update

  if (conditionState !== ConditionState.Active) {
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
