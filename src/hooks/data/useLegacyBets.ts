import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'
import {
  BetConditionStatus, BetOrderState, BetResult, type BetsFilter, BetStatusFilter, type ChainId, GameState,
  GraphBetStatus, Legacy_Bet_OrderBy, LegacyBetsDocument, type LegacyBetsQuery, type LegacyBetsQueryVariables,
  LegacyGameStatus, LegacyLiveGamesDocument, type LegacyLiveGamesQuery, type LegacyLiveGamesQueryVariables,
  normalizeBetsFilter, OrderDirection, SelectionResult, toBetStatusWhere, toSettledBetsWhere,
} from '@azuro-org/toolkit'
import { type InfiniteData, useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query'
import { type Address, type Hex } from 'viem'

import { useOptionalChain } from '../../contexts/chain'
import { type SportHub, type Bet, type BetOutcome, type InfiniteQueryParameters } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'
import { betsQueryKeys } from '../../helpers/betsQueryKeys'


type UseLegacyBetsResult = {
  bets: Bet[],
  nextPage: number | undefined,
}

export type UseLegacyBetsProps = {
  /**
   * Legacy v2 bets are stored in different entities and only support `bettor`, `affiliate` and
   * `status`. When any of the remaining fields is set, this hook returns no bets at all, so that a
   * filtered list can never mix in v2 rows that the filter was not actually applied to.
   * */
  filter: BetsFilter
  itemsPerPage?: number
  orderBy?: Legacy_Bet_OrderBy
  orderDir?: OrderDirection
  chainId?: ChainId
  query?: InfiniteQueryParameters<UseLegacyBetsResult>
}

export type UseLegacyBets = (props: UseLegacyBetsProps) => UseInfiniteQueryResult<InfiniteData<UseLegacyBetsResult>>

/**
 * Fetches betting history from legacy Azuro contracts (v2) with infinite scroll pagination.
 * Supports filtering by lifecycle status (Unredeemed, Accepted, Settled, CashedOut).
 *
 * Use this hook for historical bets placed on legacy contracts. For current bets, use `useBets` instead.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useLegacyBets
 *
 * @example
 * import { useLegacyBets } from '@azuro-org/sdk'
 *
 * const { data, isFetching, hasNextPage, fetchNextPage } = useLegacyBets({
 *   filter: { bettor: '0x...' },
 * })
 * const allBets = data?.pages.flatMap(page => page.bets) || []
 * */
export const useLegacyBets: UseLegacyBets = (props) => {
  const {
    filter,
    itemsPerPage = 100,
    orderBy = Legacy_Bet_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Asc,
    chainId,
    query,
  } = props

  const { graphql, chain } = useOptionalChain(chainId)

  const gqlLink = graphql.bets

  const normalizedFilter = normalizeBetsFilter(filter)

  return useInfiniteQuery({
    queryKey: betsQueryKeys.legacyList({
      chainId: chain.id,
      filter: normalizedFilter,
      itemsPerPage,
      orderBy,
      orderDir,
    }),
    queryFn: async ({ pageParam }) => {
      const { bettor, affiliate, status, kind, createdFrom, createdTo, isFreebet } = normalizedFilter

      // an empty bettor would be dropped from the serialized variables and the query would then
      // match every bettor's bets, so fail loudly instead of returning someone else's history
      if (!bettor) {
        throw new Error('useLegacyBets: "filter.bettor" is required')
      }

      const isUnsupportedByV2 = kind !== undefined
        || createdFrom !== undefined
        || createdTo !== undefined
        || isFreebet !== undefined

      if (status === BetStatusFilter.Pending || isUnsupportedByV2) {
        return {
          bets: [],
          nextPage: undefined,
        }
      }

      const variables: LegacyBetsQueryVariables = {
        first: itemsPerPage,
        skip: itemsPerPage * (pageParam - 1),
        orderBy,
        orderDirection: orderDir,
        where: {
          actor: bettor,
          // shared with `useBets` so the two cannot disagree on what a lifecycle preset means
          ...toBetStatusWhere(status),
        },
      }

      if (affiliate) {
        variables.where.affiliate = affiliate
      }

      // must run last: it distributes every constraint collected above across its branches. Shares
      // the definition with `useBets` so both hooks agree on what "settled" means.
      if (status === BetStatusFilter.Settled) {
        variables.where = toSettledBetsWhere(variables.where)
      }

      const { bets: prematchBets, liveBets } = await gqlRequest<LegacyBetsQuery, LegacyBetsQueryVariables>({
        url: gqlLink,
        document: LegacyBetsDocument,
        variables,
      })

      if (!prematchBets?.length && !liveBets?.length) {
        return {
          bets: [],
          nextPage: undefined,
        }
      }

      let liveGames: Record<string, LegacyLiveGamesQuery['games'][0]>

      if (liveBets?.length) {
        const gameIds = liveBets.reduce((acc, { selections }) => {
          selections.forEach((selection) => {
            const { outcome: { condition: { gameId } } } = selection

            acc.add(gameId)
          })

          return acc
        }, new Set<string>())

        const { games } = await gqlRequest<LegacyLiveGamesQuery, LegacyLiveGamesQueryVariables>({
          url: graphql.legacyLive,
          document: LegacyLiveGamesDocument,
          variables: {
            first: 1000,
            where: {
              gameId_in: [ ...gameIds ],
            },
          },
        })

        liveGames = games.reduce<Record<string, LegacyLiveGamesQuery['games'][0]>>((acc, game) => {
          acc[game.gameId] = game

          return acc
        }, {})
      }

      const bets = [ ...(prematchBets || []), ...(liveBets || []) ].map((rawBet) => {
        const {
          tokenId, actor, status, amount, odds, settledOdds, createdAt, resolvedAt, result, affiliate, selections,
          cashout: _cashout, isCashedOut, payout: _payout, isRedeemed: _isRedeemed, isRedeemable, txHash,
          redeemedTxHash,
          core: {
            address: coreAddress,
            liquidityPool: {
              address: lpAddress,
            },
          },
        } = rawBet

        const { freebet } = rawBet as LegacyBetsQuery['bets'][0]

        const isWin = result === BetResult.Won
        const isLose = result === BetResult.Lost
        const isCanceled = status === GraphBetStatus.Canceled
        // express bets have a specific feature - protocol redeems LOST expresses to release liquidity,
        // so we should validate it by "win"/"canceled" statuses
        const isRedeemed = (isWin || isCanceled) && _isRedeemed
        const isFreebet = Boolean(freebet)
        const freebetId = freebet?.freebetId || null
        // `payout` is deliberately gated on redeemability: it answers "is there money to claim?"
        const payout = isRedeemable && isWin ? +_payout! : null
        // `settledPayout` answers "what did this bet return?" and stays populated after redemption,
        // which is what historical and aggregate views need
        const settledPayout = _payout !== null && _payout !== undefined ? +_payout : null
        const betDiff = isFreebet ? amount : 0 // for freebet we must exclude bonus value from possible win
        const totalOdds = settledOdds ? +settledOdds : +odds
        const possibleWin = +amount * totalOdds - +betDiff
        const cashout = isCashedOut ? _cashout?.payout : undefined

        const outcomes = selections
          .map<BetOutcome>((selection) => {
          const {
            odds,
            result,
            outcome: {
              outcomeId,
              condition: {
                conditionId,
                status: conditionStatus,
              },
            },
          } = selection

          const {
            outcome: {
              title: customSelectionName,
              condition: {
                title: customMarketName,
                game: prematchGame,
              },
            },
          } = selection as LegacyBetsQuery['bets'][0]['selections'][0]

          const { outcome: { condition: { gameId: liveGameId } } } = selection as LegacyBetsQuery['liveBets'][0]['selections'][0]

          const game = prematchGame || liveGames[liveGameId]

          const isWin = result ? result === SelectionResult.Won : null
          const isLose = result ? result === SelectionResult.Lost : null
          const isCanceled = !result && (
            conditionStatus === BetConditionStatus.Canceled
                  || game.status === LegacyGameStatus.Paused
          )
          const isLive = !prematchGame

          const marketName = customMarketName && customMarketName !== 'null' ? customMarketName : getMarketName({ outcomeId })
          const selectionName = customSelectionName && customSelectionName !== 'null' ? customSelectionName : getSelectionName({ outcomeId, withPoint: true })

          return {
            selectionName,
            outcomeId,
            conditionId,
            coreAddress,
            odds: +odds,
            marketName,
            game: {
              id: game.id,
              gameId: game.gameId,
              slug: game.slug ?? '',
              title: game.title || '',
              startsAt: game.startsAt,
              state: GameState.Finished,
              sport: {
                ...game.sport,
                sporthub: {
                  ...game.sport.sporthub,
                  slug: game.sport.sporthub.slug as SportHub,
                },
              },
              league: {
                ...game.league,
                isTopLeague: false,
              },
              country: game.league.country,
              participants: game.participants.map((participant) => ({
                name: participant.name,
                image: participant.image,
              })),
              turnover: '0',
            },
            isWin,
            isLose,
            isCanceled,
            isLive,
          }
        })
          .sort((a, b) => +a.game.startsAt - +b.game.startsAt)

        const mapStatusToState = (status: GraphBetStatus): BetOrderState => {
          switch (status) {
            case GraphBetStatus.Canceled:
              return BetOrderState.Canceled
            case GraphBetStatus.Accepted:
              return BetOrderState.Accepted
            case GraphBetStatus.Resolved:
              return BetOrderState.Settled
          }
        }

        const bet: Bet = {
          orderId: `${actor.toLowerCase()}_${tokenId}`,
          actor: actor as Address,
          affiliate: affiliate as Address,
          tokenId,
          orderState: mapStatusToState(status),
          redeemedAt: null,
          isFreebetAmountReturnable: true,
          paymaster: null,
          freebetId,
          txHash: txHash as Hex,
          redeemedTxHash: redeemedTxHash as Hex,
          totalOdds,
          status,
          amount,
          possibleWin,
          payout,
          settledPayout,
          createdAt: +createdAt,
          resolvedAt: resolvedAt ? +resolvedAt : null,
          cashout,
          isRejected: false,
          rejectedErrorCode: null,
          isWin,
          isLose,
          isRedeemable,
          isRedeemed,
          isCanceled,
          isCashedOut,
          coreAddress: coreAddress as Address,
          lpAddress: lpAddress as Address,
          outcomes,
        }

        return bet
      })

      return {
        bets,
        nextPage: bets.length < itemsPerPage ? undefined : pageParam + 1,
      }
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => lastPage.nextPage ?? undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
    // See the note in useBets: an absent bettor would match every bettor's bets, so the request
    // layer rejects it. Stay idle rather than erroring while the wallet is disconnected.
    enabled: Boolean(filter.bettor),
    ...(query || {}),
  })
}
