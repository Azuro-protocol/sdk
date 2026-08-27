import { ConditionState } from '@azuro-org/toolkit'


/**
 * States the feed reports for a settled condition. `ConditionState` deliberately doesn't declare
 * them yet, so they are named here, locally, for the migration window - everywhere else compares
 * against `ConditionState.Active` and treats anything else as inactive.
 * */
const settledConditionStates: string[] = [ 'Resolved', 'Canceled' ]

/**
 * Whether a condition update means per-outcome state has to be re-read from the feed.
 *
 * An update whose condition is not `Active` reports every one of its outcomes as `Stopped`, so it
 * carries no per-outcome settlement and the real values have to come from the state endpoint, which
 * is authoritative for them. A parked condition streams such updates for the rest of its life, so
 * the re-read is limited to the messages that can carry news: the move into an inactive state, and
 * every settled report, since the feed can un-settle a condition and its settlement is not final.
 * */
export const getShouldRefetchOutcomes = (
  prevConditionState: ConditionState | undefined,
  conditionState: ConditionState
) => {
  if (conditionState === ConditionState.Active) {
    return false
  }

  if (settledConditionStates.includes(conditionState)) {
    return true
  }

  return prevConditionState !== conditionState
}
