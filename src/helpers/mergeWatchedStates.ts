type WatchedStates<State, Entry extends { state: State }> = {
  states: Record<string, State>
  statesMap: Record<string, Entry>
}

/**
 * Re-key the state of a watch hook when the set of watched ids changes, without throwing away what
 * the socket has taught us.
 *
 * An id that is still watched keeps its current entry, so both things the socket is the only source
 * of survive a fetch that adds or removes an id: the latched visibility, which no refetch can
 * re-report, and per-outcome settlement, which is only reported by updates whose condition is
 * active. Discarding them would re-hide revealed markets and un-settle settled outcomes every time
 * the feed adds a condition to a running game, which it does throughout.
 *
 * An id that has just appeared takes its initial entry, or no entry at all when there is nothing to
 * seed it from - the caller then reads it from the feed. An id that is no longer watched is dropped,
 * so the maps track the watched set rather than growing for the life of the page. Clearing the
 * watched set to empty needs no special case: everything is dropped by the same rule.
 * */
export const mergeWatchedStates = <State, Entry extends { state: State }>(
  prevValue: WatchedStates<State, Entry>,
  initialValue: WatchedStates<State, Entry>,
  keys: string[]
): WatchedStates<State, Entry> => (
  keys.reduce<WatchedStates<State, Entry>>((acc, key) => {
    const entry = prevValue.statesMap[key] ?? initialValue.statesMap[key]

    if (entry) {
      acc.states[key] = entry.state
      acc.statesMap[key] = entry
    }

    return acc
  }, { states: {}, statesMap: {} })
)
