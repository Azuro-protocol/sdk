import {
  type LegacyPrematchBetsQueryVariables,
  type LegacyPrematchBetsQuery,

  OrderDirection,
  Legacy_Bet_OrderBy,
  GraphBetStatus,
  LegacyPrematchBetsDocument,
  BetResult,
  SelectionResult,
  BetConditionStatus,
  GameState,
  LegacyGameStatus,
} from '@azuro-org/toolkit'
import { type Address } from 'viem'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'

import { useChain } from '../../contexts/chain'
import { BetType, type Bet, type BetOutcome, type InfiniteQueryParameters } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


type QueryResult = {
  bets: Bet[],
  nextPage: number | undefined,
}

export type UseLegacyBetsProps = {
  filter: {
    bettor: Address
    affiliate?: string
    type?: BetType
    limit?: number
  }
  itemsPerPage?: number
  orderBy?: Legacy_Bet_OrderBy
  orderDir?: OrderDirection
  query?: InfiniteQueryParameters<QueryResult>
}

export const useLegacyBets = (props: UseLegacyBetsProps) => {
  const {
    filter,
    itemsPerPage = 100,
    orderBy = Legacy_Bet_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Asc,
    query,
  } = props

  const { graphql } = useChain()

  const gqlLink = graphql.bets

  return useInfiniteQuery({
    queryKey: [
      'bets',
      gqlLink,
      filter.bettor,
      filter.type,
      filter.limit,
      filter.affiliate,
      itemsPerPage,
      orderBy,
      orderDir,
    ],
    queryFn: async ({ pageParam }) => {
      const variables: LegacyPrematchBetsQueryVariables = {
        first: itemsPerPage,
        skip: itemsPerPage * (pageParam - 1),
        orderBy,
        orderDirection: orderDir,
        where: {
          actor: filter.bettor?.toLowerCase(),
        },
      }

      if (filter.type === BetType.Unredeemed) {
        variables.where.isRedeemable = true
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
        variables.where.affiliate = filter.affiliate
      }

      const { bets: _bets } = await gqlRequest<LegacyPrematchBetsQuery, LegacyPrematchBetsQueryVariables>({
        url: gqlLink,
        document: LegacyPrematchBetsDocument,
        variables,
      })

      const bets = _bets.map((rawBet) => {
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

        const outcomes = selections
          .map<BetOutcome>((selection) => {
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
                game,
              },
            },
          } = selection

          const isWin = result ? result === SelectionResult.Won : null
          const isLose = result ? result === SelectionResult.Lost : null
          const isCanceled = (
            conditionStatus === BetConditionStatus.Canceled
                  || game.status === LegacyGameStatus.Paused
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
            game: {
              id: game.id,
              gameId: game.gameId,
              title: game.title || '',
              startsAt: game.startsAt,
              state: GameState.Finished,
              sport: game.sport,
              league: game.league,
              country: game.league.country,
              participants: game.participants,
            },
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
