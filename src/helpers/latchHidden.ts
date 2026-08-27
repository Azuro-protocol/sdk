/**
 * Visibility of a condition or an outcome is latched one way: once it has been reported visible it
 * stays visible.
 *
 * The feed suspends and re-prices markets continuously and `hidden` follows that, so taking every
 * value would make markets vanish and come back while a bettor is reading them - the list reflows
 * and the market under the cursor moves. Latched instead, a market that stops stays where it is,
 * locked, and a market that was hidden at fetch time is revealed at most once.
 *
 * `undefined` means "not reported", not "visible": only an explicit `false` closes the latch.
 * */
export const latchHidden = (prevHidden: boolean | undefined, nextHidden: boolean | undefined) => {
  if (prevHidden === false) {
    return false
  }

  return nextHidden ?? prevHidden
}
