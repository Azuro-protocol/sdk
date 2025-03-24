import {
  OrderDirection,
  Bet_OrderBy,

  type BetsQueryVariables,
  type BetsQuery,
  type GamesQuery,
  type GamesQueryVariables,

  GraphBetStatus,
  BetsDocument,
  BetResult,
  SelectionResult,
  BetConditionStatus,
  GameState,
} from '@azuro-org/toolkit'
import { type Address } from 'viem'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'

import { useChain } from '../../contexts/chain'
import { type Bet, type BetOutcome, type InfiniteQueryParameters } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


type QueryResult = {
  data: Bet[],
  nextPage: number,
}

export type UseBetsProps = {
  filter: {
    bettor: Address
    affiliate?: string
    type?: AzuroSDK.BetType
    limit?: number
  }
  orderBy?: Bet_OrderBy
  orderDir?: OrderDirection
  query?: InfiniteQueryParameters<QueryResult>
}

export const useBets = (props: UseBetsProps) => {
  const {
    filter,
    orderBy = Bet_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Asc,
    query,
  } = props

  const { graphql } = useChain()

  const gqlLink = graphql.feed

  return useInfiniteQuery({
    queryKey: [
      'games',
      gqlLink,
      filter.limit,
      filter.bettor,
      filter.type,
      filter.affiliate,
      orderBy,
      orderDir,
    ],
    queryFn: async ({ pageParam }) => {
      const ITEMS_PER_PAGE = filter.limit ?? 100

      const variables: BetsQueryVariables = {
        first: ITEMS_PER_PAGE,
        skip: ITEMS_PER_PAGE * (pageParam - 1),
        orderBy,
        orderDirection: orderDir,
        where: {
          actor: filter.bettor?.toLowerCase(),
        },
      }

      if (filter.type === AzuroSDK.BetType.Unredeemed) {
        variables.where.isRedeemable = true
      }

      if (filter.type === AzuroSDK.BetType.Accepted) {
        variables.where.status = GraphBetStatus.Accepted
        variables.where.isCashedOut = false
      }

      if (filter.type === AzuroSDK.BetType.Settled) {
        variables.where.status_in = [ GraphBetStatus.Resolved, GraphBetStatus.Canceled ]
      }

      if (filter.type === AzuroSDK.BetType.CashedOut) {
        variables.where.isCashedOut = true
      }

      if (filter.affiliate) {
        variables.where.affiliate = filter.affiliate
      }

      const { v3Bets } = await gqlRequest<BetsQuery, BetsQueryVariables>({
        url: gqlLink,
        document: BetsDocument,
        variables,
      })

      const gameIds = v3Bets.reduce((acc, { selections }) => {
        selections.forEach((selection) => {
          const { outcome: { condition: { gameId } } } = selection

          acc.add(gameId)
        })

        return acc
      }, new Set<string>())


      const { games } = await gqlRequest<GamesQuery, GamesQueryVariables>({
        url: graphql.feed,
        document: BetsDocument,
        variables: {
          first: 1000,
          where: {
            gameId_in: [ ...gameIds ],
          },
        },
      })

      const gameByGameId = games.reduce((acc, game) => {
        acc[game.gameId] = game

        return acc
      }, {} as Record<string, GamesQuery['games'][0]>)

      const bets = v3Bets.map((rawBet) => {
        const {
          tokenId, status, amount, odds, settledOdds, createdAt, result, affiliate, selections,
          cashout: _cashout, isCashedOut, payout: _payout, isRedeemed: _isRedeemed, isRedeemable, freebet, txHash,
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
        const isFreebet = Boolean(freebet)
        const freebetId = freebet?.freebetId
        const freebetContractAddress = freebet?.contractAddress
        const payout = isRedeemable && isWin ? +_payout! : null
        const betDiff = isFreebet ? amount : 0 // for freebet we must exclude bonus value from possible win
        const totalOdds = settledOdds ? +settledOdds : +odds
        const possibleWin = +amount * totalOdds - +betDiff
        const cashout = isCashedOut ? _cashout?.payout : undefined

        const outcomes: BetOutcome[] = selections
          .map((selection) => {
            const {
              odds,
              result,
              outcome: {
                outcomeId,
                title: customSelectionName,
                condition: {
                  conditionId,
                  status: conditionStatus,
                  title: customMarketName,
                  gameId,
                },
              },
            } = selection

            const game = gameByGameId[gameId]!

            const isWin = result ? result === SelectionResult.Won : null
            const isLose = result ? result === SelectionResult.Lost : null
            const isCanceled = (
              conditionStatus === BetConditionStatus.Canceled
                  || game.state === GameState.Stopped
            )

            const marketName = customMarketName && customMarketName !== 'null' ? customMarketName : getMarketName({ outcomeId })
            const selectionName = customSelectionName && customSelectionName !== 'null' ? customSelectionName : getSelectionName({ outcomeId, withPoint: true })

            return {
              selectionName,
              outcomeId,
              conditionId,
              coreAddress,
              odds: +odds,
              marketName,
              game,
              isWin,
              isLose,
              isCanceled,
            }
          })
          .sort((a, b) => +a.game.startsAt - +b.game.startsAt)

        const bet: Bet = {
          affiliate: affiliate!,
          tokenId,
          freebetContractAddress: freebetContractAddress as Address,
          freebetId,
          txHash,
          totalOdds,
          status,
          amount,
          possibleWin,
          payout,
          createdAt: +createdAt,
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
          isLive: false,
        }

        return bet
      })

      return {
        data: bets,
        nextPage: games.length < ITEMS_PER_PAGE ? NaN : pageParam + 1,
      }
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => lastPage.nextPage ?? undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...(query || {}),
  })
}
