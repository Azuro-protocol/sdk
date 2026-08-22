import { type ChainId, type Legacy_Bet_OrderBy, type NormalizedBetsFilter, type OrderDirection } from '@azuro-org/toolkit'
import { type QueryKey } from '@tanstack/react-query'


/**
 * Every bettor-scoped bets query key is built here, and only here.
 *
 * Three slots are a contract with consumers and must not be reordered:
 *
 * - `[0]` is the query root, one of `betsQueryKeyRoots`. Apps invalidate by the `[ root, chainId ]`
 *   prefix after a bet is placed.
 * - `[1]` is the chain id, for the same reason.
 * - `[2]` is the **lowercased** bettor address, read positionally by cache patchers to find the
 *   queries belonging to the connected account. It is kept out of the filter object in slot `[3]`
 *   precisely so that a positional read stays possible.
 *
 * Everything else in the filter lives in slot `[3]` as a normalized, JSON-safe object, which
 * react-query hashes structurally, so key equality does not depend on property order.
 * */

export const betsQueryKeyRoots = [ 'bets', 'legacy-bets', 'bets-report' ] as const

export type BetsQueryKeyRoot = typeof betsQueryKeyRoots[number]

const splitBettor = (filter: NormalizedBetsFilter) => {
  const { bettor, ...filterWithoutBettor } = filter

  return { bettor, filterWithoutBettor }
}

export type BetsListQueryKeyProps = {
  chainId: ChainId
  filter: NormalizedBetsFilter
  itemsPerPage: number
}

export type LegacyBetsListQueryKeyProps = BetsListQueryKeyProps & {
  orderBy: Legacy_Bet_OrderBy
  orderDir: OrderDirection
}

export type BetsReportQueryKeyProps = {
  chainId: ChainId
  filter: NormalizedBetsFilter
}

export const betsQueryKeys = {
  list: ({ chainId, filter, itemsPerPage }: BetsListQueryKeyProps) => {
    const { bettor, filterWithoutBettor } = splitBettor(filter)

    return [ 'bets', chainId, bettor, filterWithoutBettor, itemsPerPage ] as const
  },
  legacyList: ({ chainId, filter, itemsPerPage, orderBy, orderDir }: LegacyBetsListQueryKeyProps) => {
    const { bettor, filterWithoutBettor } = splitBettor(filter)

    return [ 'legacy-bets', chainId, bettor, filterWithoutBettor, itemsPerPage, orderBy, orderDir ] as const
  },
  // the report is an aggregate over all matching bets, so it is page-independent: changing the page
  // size of a list must not evict it, which is why `itemsPerPage` is deliberately absent here
  report: ({ chainId, filter }: BetsReportQueryKeyProps) => {
    const { bettor, filterWithoutBettor } = splitBettor(filter)

    return [ 'bets-report', chainId, bettor, filterWithoutBettor ] as const
  },
  /** Prefix matching every report for one bettor on one chain, whatever the rest of the filter is. */
  reportPrefix: ({ chainId, bettor }: { chainId: ChainId, bettor: string }) => (
    [ 'bets-report', chainId, bettor.toLowerCase() ] as const
  ),
}

/**
 * Matches every bets query (list, legacy list and report) belonging to one bettor on one chain,
 * whatever the rest of the filter is. Used to invalidate after an action that can change any of
 * the bettor's bets. Over-invalidating a handful of queries is cheap; missing one is not.
 * */
export const isBettorBetsQueryKey = (queryKey: QueryKey, chainId: ChainId, bettorLowerCased: string) => (
  betsQueryKeyRoots.includes(queryKey[0] as BetsQueryKeyRoot)
  && queryKey[1] === chainId
  && String(queryKey[2]).toLowerCase() === bettorLowerCased
)
