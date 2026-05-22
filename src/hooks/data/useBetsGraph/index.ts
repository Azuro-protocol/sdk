import {
  type GameData,
  type ChainId,
  SelectionKind,
  GraphBetStatus,
  BetResult,
  SelectionResult,
  BetConditionStatus,
  GameState,
  getGamesByIds,
  calcMinOdds,
  BetOrderState,
} from '@azuro-org/toolkit'
import { type Hex, type Address } from 'viem'
import { type InfiniteData, useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'

import {
  type BetsQueryVariables,
  type BetsQuery,
  BetsDocument,
} from './bets'
import { batchFetchConditions } from '../../../helpers/batchFetchConditions'
import { useOptionalChain } from '../../../contexts/chain'
import { BetType, type Bet, type BetOutcome, type InfiniteQueryParameters } from '../../../global'
import { gqlRequest } from '../../../helpers/gqlRequest'
import { formatToFixed } from '../../../helpers/formatToFixed'


type UseBetsResult = {
  bets: Bet[],
  nextPage: number | undefined,
}

export type UseBetsProps = {
  filter: {
    bettor: Address
    affiliate?: string
    type?: BetType
  }
  chainId?: ChainId
  itemsPerPage?: number
  query?: InfiniteQueryParameters<UseBetsResult>
}

export type UseBets = (props: UseBetsProps) => UseInfiniteQueryResult<InfiniteData<UseBetsResult>>

export const useBets: UseBets = (props) => {
  const {
    filter,
    chainId,
    itemsPerPage = 100,
    query,
  } = props

  const { graphql, chain } = useOptionalChain(chainId)

  const gqlLink = graphql.bets

  return useInfiniteQuery({
    queryKey: [
      'bets',
      chain.id,
      filter.bettor,
      filter.type,
      filter.affiliate,
      itemsPerPage,
    ],
    queryFn: async ({ pageParam }) => {
      const variables: BetsQueryVariables = {
        first: itemsPerPage,
        skip: itemsPerPage * (pageParam - 1),
        where: {
          actor: filter.bettor?.toLowerCase(),
        },
      }

      if (filter.type === BetType.Unredeemed) {
        variables.where.isRedeemable = true
        variables.where.isCashedOut = false
      }

      if (filter.type === BetType.Accepted) {
        variables.where.status = GraphBetStatus.Accepted
        variables.where.isCashedOut = false
      }

      if (filter.type === BetType.Settled) {
        variables.where.status_in = [ GraphBetStatus.Resolved, GraphBetStatus.Canceled ]
      }

      if (filter.type === BetType.CashedOut) {
        variables.where.isCashedOut = true
      }

      if (filter.affiliate) {
        variables.where.affiliate = filter.affiliate.toLowerCase()
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
        const payout = isRedeemable && isWin ? +_payout! : null
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

            const isWin = result ? result === SelectionResult.Won : null
            const isLose = result ? result === SelectionResult.Lost : null
            const isCanceled = !result && conditionStatus === BetConditionStatus.Canceled

            const isLive = conditionKind === SelectionKind.Live

            if (isCombo && !isCanceled) {
              subBetOdds.push(+odds)
            }

            const isConditionV5 = conditionId[0] === '5'

            const customSelectionName = _customSelectionName && _customSelectionName !== 'null'
              ? _customSelectionName
              // @ts-expect-error
              : conditionsFeedData?.[conditionId]?.outcomes[outcomeId]?.title as string | undefined

            const customMarketName = _customMarketName && _customMarketName !== 'null'
              ? _customMarketName
              // @ts-expect-error
              : conditionsFeedData?.[conditionId]?.title as string | undefined

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

        let totalOdds = isCombo
          ? +formatToFixed(calcMinOdds({ odds: subBetOdds, slippage: 0 }), 2)
          : settledOdds ? +settledOdds : +odds

        const possibleWin = +amount * totalOdds - +betDiff

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
    ...(query || {}),
  })
}
