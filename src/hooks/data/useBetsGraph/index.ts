import {
  type GameData,
  type ChainId,
  type BetsFilter,
  type BetsQueryVariables,
  type BetsQuery,
  BetsDocument,
  SelectionKind,
  GraphBetStatus,
  BetResult,
  SelectionResult,
  OutcomeResult,
  GameState,
  getGamesByIds,
  calcMinOdds,
  isSelectionCanceled,
  normalizeBetsFilter,
  toGraphBetsWhere,
  BetOrderState,
} from '@azuro-org/toolkit'
import { type Hex, type Address } from 'viem'
import { type InfiniteData, useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'

import { batchFetchConditions } from '../../../helpers/batchFetchConditions'
import { useOptionalChain } from '../../../contexts/chain'
import { type Bet, type BetOutcome, type InfiniteQueryParameters } from '../../../global'
import { gqlRequest } from '../../../helpers/gqlRequest'
import { formatToFixed } from '../../../helpers/formatToFixed'
import { betsQueryKeys } from '../../../helpers/betsQueryKeys'


type UseBetsResult = {
  bets: Bet[],
  nextPage: number | undefined,
}

export type UseBetsProps = {
  filter: BetsFilter
  chainId?: ChainId
  itemsPerPage?: number
  query?: InfiniteQueryParameters<UseBetsResult>
}

export type UseBets = (props: UseBetsProps) => UseInfiniteQueryResult<InfiniteData<UseBetsResult>>

/**
 * Fetches betting history for a specific bettor with infinite scroll pagination.
 * Filterable by lifecycle status, single/combo kind, creation date range and freebet funding.
 *
 * The filter is turned into a subgraph query by the same code `useBetsReport` uses, so a report
 * built from the same filter describes exactly the bets returned here.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useBets
 *
 * @example
 * import { useBets } from '@azuro-org/sdk'
 *
 * const { data, isFetching, hasNextPage, fetchNextPage } = useBets({
 *   filter: { bettor: '0x...' },
 * })
 *
 * const allBets = data?.pages.flatMap(page => page.bets) || []
 * */
export const useBets: UseBets = (props) => {
  const {
    filter,
    chainId,
    itemsPerPage = 100,
    query,
  } = props

  const { graphql, chain } = useOptionalChain(chainId)

  const gqlLink = graphql.bets

  const normalizedFilter = normalizeBetsFilter(filter)

  return useInfiniteQuery({
    queryKey: betsQueryKeys.list({ chainId: chain.id, filter: normalizedFilter, itemsPerPage }),
    queryFn: async ({ pageParam }) => {
      const variables: BetsQueryVariables = {
        first: itemsPerPage,
        skip: itemsPerPage * (pageParam - 1),
        where: toGraphBetsWhere(normalizedFilter),
      }

      const { v3Bets } = await gqlRequest<BetsQuery, BetsQueryVariables>({
        url: gqlLink,
        document: BetsDocument,
        variables,
      })

      if (!v3Bets?.length) {
        return {
          bets: [],
          nextPage: undefined,
        }
      }

      const { gameIds, conditionV5Ids } = v3Bets.reduce((acc, { selections }) => {
        selections.forEach((selection) => {
          const { outcome: { title: outcomeTitle, condition: { conditionId, title: conditionTitle, gameId } } } = selection

          const isConditionTitleEmpty = !conditionTitle || conditionTitle === 'null'
          const isOutcomeTitleEmpty = !outcomeTitle || outcomeTitle === 'null'

          acc.gameIds.add(gameId)

          if (conditionId[0] === '5' && (isConditionTitleEmpty || isOutcomeTitleEmpty)) {
            acc.conditionV5Ids.add(conditionId)
          }
        })

        return acc
      }, { gameIds: new Set<string>(), conditionV5Ids: new Set<string>() })

      const [ games, conditionsFeedData ] = await Promise.all([
        getGamesByIds({
          chainId: chain.id,
          gameIds: Array.from(gameIds),
        }),
        conditionV5Ids.size > 0 ? batchFetchConditions(Array.from(conditionV5Ids), chain.id) : Promise.resolve(null),
      ])

      const gameByGameId = games.reduce((acc, game) => {
        acc[game.gameId] = game

        return acc
      }, {} as Record<string, GameData>)

      const bets = v3Bets.map((rawBet) => {
        const {
          tokenId, actor, nonce, status, amount, odds, settledOdds, createdAt, resolvedAt, result, affiliate, selections,
          cashout: _cashout, isCashedOut, payout: _payout, isRedeemed: _isRedeemed, isRedeemable, txHash,
          freebetId,
          isFreebetAmountReturnable,
          paymasterContractAddress,
          redeemedTxHash,
          core: {
            address: coreAddress,
            liquidityPool: {
              address: lpAddress,
            },
          },
        } = rawBet

        const isWin = result === BetResult.Won
        const isLose = result === BetResult.Lost
        const isCanceled = status === GraphBetStatus.Canceled
        // express bets have a specific feature - protocol redeems LOST expresses to release liquidity,
        // so we should validate it by "win"/"canceled" statuses
        const isRedeemed = (isWin || isCanceled) && _isRedeemed
        const isFreebet = Boolean(freebetId)
        const betDiff = isFreebet && isFreebetAmountReturnable ? amount : 0 // for freebet we must exclude bonus value from possible win
        const cashout = isCashedOut ? _cashout?.payout : undefined

        const isCombo = selections.length > 1
        let subBetOdds: number[] = []

        const outcomes: BetOutcome[] = selections
          .map((selection) => {
            const {
              odds,
              result,
              conditionKind,
              outcome: {
                outcomeId,
                title: _customSelectionName,
                result: outcomeResult,
                condition: {
                  conditionId,
                  status: conditionStatus,
                  title: _customMarketName,
                  gameId,
                  wonOutcomeIds,
                },
              },
            } = selection

            const game = gameByGameId[gameId]!

            // a leg can be voided on its own while its condition stays `Resolved`, so no single
            // field answers this - `isSelectionCanceled` is the one place that folds the signals
            const isCanceled = isSelectionCanceled({
              selectionResult: result,
              outcomeResult,
              conditionStatus,
            })

            // won / lost / void / pending must stay mutually exclusive, so a voided leg reports
            // `false` (settled, no winnings) rather than `null` (still pending).
            const isWin = isCanceled ? false
              : outcomeResult ? outcomeResult === OutcomeResult.Won
                : result ? result === SelectionResult.Won : null
            const isLose = isCanceled ? false
              : outcomeResult ? outcomeResult === OutcomeResult.Lost
                : result ? result === SelectionResult.Lost : null

            const isLive = conditionKind === SelectionKind.Live

            if (isCombo && !isCanceled) {
              subBetOdds.push(+odds)
            }

            const isConditionV5 = conditionId[0] === '5'

            const customSelectionName = _customSelectionName && _customSelectionName !== 'null'
              ? _customSelectionName
              : conditionsFeedData?.[conditionId]?.outcomes[outcomeId]?.title

            const customMarketName = _customMarketName && _customMarketName !== 'null'
              ? _customMarketName
              : conditionsFeedData?.[conditionId]?.title

            const marketName = isConditionV5
              ? customMarketName || 'missed_market_title'
              : customMarketName || getMarketName({ outcomeId })

            const selectionName = isConditionV5
              ? customSelectionName || 'missed_outcome_title'
              : customSelectionName || getSelectionName({ outcomeId, withPoint: true })

            return {
              selectionName,
              outcomeId,
              conditionId,
              coreAddress,
              odds: +odds,
              marketName,
              wonOutcomeIds: wonOutcomeIds || null,
              game,
              isWin,
              isLose,
              isCanceled,
              isLive,
            }
          })
          .sort((a, b) => +(a.game?.startsAt || 0) - +(b.game?.startsAt || 0))

        // a bet with nothing left standing returns the stake. `settledOdds` keeps the original odds
        // even then, and `calcMinOdds` of an empty list is 0.99 - the combo fee applied to no legs
        // at all - so neither can be used here
        let totalOdds = isCanceled || (isCombo && !subBetOdds.length) ? 1
          : isCombo
            ? +formatToFixed(calcMinOdds({ odds: subBetOdds, slippage: 0 }), 2)
            : settledOdds ? +settledOdds : +odds

        const possibleWin = +amount * totalOdds - +betDiff

        /**
         * The recorded payout of a won combo with a voided leg is the FULL pre-void payout until the
         * bet is redeemed: the indexer writes it at settlement and only replaces it with the real
         * on-chain amount when the bettor claims. Redeemed bets keep reading the recorded value -
         * by then it is the amount actually paid.
         *
         * Gross, like every payout the protocol records: `possibleWin` nets out the stake of a
         * returnable freebet, which is a display rule and does not belong in this figure.
         * */
        const isRecordedPayoutStale = isWin && isCombo && !_isRedeemed && !isCashedOut

        const recordedPayout = _payout !== null && _payout !== undefined ? +_payout : null
        const rebuiltPayout = +amount * totalOdds

        // `payout` is deliberately gated on redeemability: it answers "is there money to claim?"
        const payout = isRedeemable && isWin ? (isRecordedPayoutStale ? rebuiltPayout : recordedPayout) : null
        // `settledPayout` answers "what did this bet return?" and stays populated after redemption,
        // which is what historical and aggregate views need
        const settledPayout = isRecordedPayoutStale ? rebuiltPayout : recordedPayout

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
          orderId: `${actor.toLowerCase()}_${nonce}`,
          orderState: mapStatusToState(status),
          rejectedErrorCode: null,
          isRejected: false,
          actor: actor as Address,
          affiliate: affiliate as Address,
          tokenId,
          freebetId: freebetId || null,
          isFreebetAmountReturnable: isFreebetAmountReturnable ?? null,
          paymaster: paymasterContractAddress as Address || null,
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
    // Without a bettor the query would have no `actor` constraint at all, which matches every
    // bettor's bets rather than none. The request layer rejects that, so stay idle instead of
    // surfacing an error while the wallet is still disconnected.
    enabled: Boolean(filter.bettor),
    ...(query || {}),
  })
}
