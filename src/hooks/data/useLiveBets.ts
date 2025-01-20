import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'
import { type Address } from 'viem'
import {
  type Selection,
  Bet_OrderBy,
  OrderDirection,
  BetResult,
  GraphBetStatus,
  SelectionResult,
  ConditionStatus,

  type LiveBetsQuery,
  type LiveBetsQueryVariables,
  LiveBetsDocument,

  type MainGameInfoFragment,
  MainGameInfoFragmentDoc,

  type GameQuery,
  type GamesQuery,
  GamesDocument,
} from '@azuro-org/toolkit'

import { useApolloClients } from '../../contexts/apollo'
import { BetType, type Bet } from '../../global'


type LiveBetOutcome = {
  selectionName: string
  odds: number
  marketName: string
  gameId: GameQuery['games'][0]['gameId']
  isWin: boolean | null
  isLose: boolean | null
  isCanceled: boolean
} & Selection

type LiveBet = {
  affiliate: string
  tokenId: string
  totalOdds: number
  coreAddress: Address
  lpAddress: Address
  outcomes: LiveBetOutcome[]
  txHash: string
  status: GraphBetStatus
  amount: string
  possibleWin: number
  payout: number | null
  createdAt: number
  cashout?: string
  isWin: boolean
  isLose: boolean
  isRedeemable: boolean
  isRedeemed: boolean
  isCanceled: boolean
  isLive: boolean
  isCashedOut: boolean
}

export type UseLiveBetsProps = {
  filter: {
    bettor: Address
    affiliate?: string
    type?: BetType
    limit?: number
    offset?: number
  }
  orderBy?: Bet_OrderBy
  orderDir?: OrderDirection
}

export const useLiveBets = (props: UseLiveBetsProps) => {
  const {
    filter,
    orderBy = Bet_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Asc,
  } = props

  const { prematchClient, liveClient } = useApolloClients()

  const [ bets, setBets ] = useState<Array<Bet>>([])
  const [ isGamesFetching, setGamesFetching ] = useState(true)

  const options = useMemo(() => {
    const variables: LiveBetsQueryVariables = {
      first: filter.limit || 1000,
      skip: filter.offset,
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
    }

    if (filter.type === BetType.Settled) {
      variables.where.status_in = [ GraphBetStatus.Resolved, GraphBetStatus.Canceled ]
      variables.where.isRedeemable = false
    }

    if (filter.type === BetType.CashedOut) {
      variables.where.isCashedOut = true
    }

    if (filter.affiliate) {
      variables.where.affiliate = filter.affiliate
    }

    return {
      variables,
      ssr: false,
      client: prematchClient!,
      skip: !filter.bettor,
      notifyOnNetworkStatusChange: true,
    } as const
  }, [
    filter.limit,
    filter.offset,
    filter.bettor,
    filter.type,
    filter.affiliate,
    orderBy,
    orderDir,
  ])

  const { data, loading: isBetsFetching, error } = useQuery<LiveBetsQuery, LiveBetsQueryVariables>(LiveBetsDocument, options)

  const { liveBets } = data || { liveBets: [] }

  const formattedBets = useMemo(() => {
    if (!liveBets.length) {
      return []
    }

    return liveBets.map((rawBet) => {
      const {
        tokenId, status, amount, odds, settledOdds, createdAt, result, affiliate,
        core: { address: coreAddress, liquidityPool: { address: lpAddress } }, cashout: _cashout, isCashedOut,
        payout: _payout, isRedeemed: _isRedeemed, isRedeemable, txHash, selections,
      } = rawBet

      const isWin = result === BetResult.Won
      const isLose = result === BetResult.Lost
      const isCanceled = status === GraphBetStatus.Canceled
      // express bets have a specific feature - protocol redeems LOST expresses to release liquidity,
      // so we should validate it by "win"/"canceled" statuses
      const isRedeemed = (isWin || isCanceled) && _isRedeemed
      const payout = isRedeemable && isWin ? +_payout! : null
      const totalOdds = settledOdds ? +settledOdds : +odds
      const possibleWin = +amount * totalOdds
      const cashout = isCashedOut ? _cashout?.payout : undefined

      const outcomes: LiveBetOutcome[] = selections
        .map((selection) => {
          const { odds, result, outcome: { outcomeId, condition: { conditionId, status: conditionStatus, gameId } } } = selection

          const isWin = result ? result === SelectionResult.Won : null
          const isLose = result ? result === SelectionResult.Lost : null
          const isCanceled = conditionStatus === ConditionStatus.Canceled

          const marketName = getMarketName({ outcomeId })
          const selectionName = getSelectionName({ outcomeId, withPoint: true })

          return {
            selectionName,
            outcomeId,
            conditionId,
            coreAddress,
            odds: +odds,
            marketName,
            gameId,
            isWin,
            isLose,
            isCanceled,
          }
        })

      const bet: LiveBet = {
        affiliate: affiliate!,
        tokenId,
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
        isLive: true,
      }

      return bet
    })
  }, [ liveBets ])

  useEffect(() => {
    if (!formattedBets.length) {
      setGamesFetching(false)

      return
    }

    ;(async () => {
      let games: Record<string, GameQuery['games'][0]> = {}
      const needToGetGames = new Set<string>()

      formattedBets.forEach(({ outcomes }) => {
        const gameId = outcomes[0]?.gameId
        const game = liveClient!.cache.readFragment<MainGameInfoFragment>({
          id: liveClient!.cache.identify({ __typename: 'Game', id: gameId }),
          fragment: MainGameInfoFragmentDoc,
          fragmentName: 'MainGameInfo',
        })

        if (game) {
          games[gameId!] = game
        }
        else {
          needToGetGames.add(gameId!)
        }
      })

      if (needToGetGames.size) {
        const { data: { games: _games } } = await liveClient!.query<GamesQuery>({
          query: GamesDocument,
          variables: {
            where: {
              gameId_in: [ ...needToGetGames ],
            },
          },
          fetchPolicy: 'network-only',
        })

        const fetchedGames = _games.reduce((acc, game) => {
          acc[game.gameId] = game

          return acc
        }, {} as Record<string, GameQuery['games'][0]>)

        games = {
          ...games,
          ...fetchedGames,
        }
      }

      const betsWithGames = formattedBets.map(bet => {
        const gameId = bet.outcomes[0]?.gameId
        const game = games[gameId!]

        if (game) {
          return {
            ...bet,
            outcomes: [ {
              ...bet.outcomes[0]!,
              game,
            } ],
          }
        }
      }).filter(Boolean) as unknown as Array<Bet>

      setGamesFetching(false)
      setBets(betsWithGames)
    })()

    return () => {
      setBets([])
    }
  }, [ formattedBets ])

  return {
    loading: isBetsFetching || isGamesFetching,
    bets,
    error,
  }
}
