import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'
import {
  BetConditionStatus, BetResult, BetOrderState, calcMinOdds, type ChainId,
  type GameData, GameState, getGamesByIds, GraphBetStatus, OrderDirection,
  getBetsByBettor, type GetBetsByBettorParams, type GetBetsByBettorResult,
  SelectionKind, SelectionResult, BetOrderResult,
} from '@azuro-org/toolkit'
import { type InfiniteData, useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query'
import { type Address, type Hex } from 'viem'

import { useOptionalChain } from '../../contexts/chain'
import { type Bet, type BetOutcome, BetType, type InfiniteQueryParameters } from '../../global'
import { formatToFixed } from '../../helpers/formatToFixed'


type UseBetsResult = {
  bets: Bet[]
  nextPage: number | undefined
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

const getIsAcceptedBetCanceled = (order: NonNullable<GetBetsByBettorResult>[0]) => {
  const { result, state, meta, txHash } = order

  return Boolean(
    meta?.status === GraphBetStatus.Canceled ||
    (txHash && (state === BetOrderState.Canceled || result === BetOrderResult.Canceled))
  )
}

/**
 * Fetches betting history for a specific bettor with infinite scroll pagination.
 * Supports filtering by bet type (Unredeemed, Accepted, Settled, CashedOut, Pending).
 *
 * Returns detailed bet information including outcomes, game data, odds, and settlement status.
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

  const { chain, contracts } = useOptionalChain(chainId)

  return useInfiniteQuery({
    queryKey: [
      'bets',
      chain.id,
      filter.bettor?.toLowerCase(),
      filter.type,
      filter.affiliate,
      itemsPerPage,
    ],
    queryFn: async ({ pageParam }) => {
      const options: GetBetsByBettorParams = {
        chainId: chain.id,
        bettor: filter.bettor,
        affiliate: filter.affiliate as Address,
        limit: itemsPerPage,
        offset: itemsPerPage * (pageParam - 1),
      }

      if (filter.type === BetType.Unredeemed) {
        options.result = [ BetOrderResult.Won, BetOrderResult.Canceled ]
        options.isRedeemed = false
        // options.isCashedOut = false
      }
      else if (filter.type === BetType.Accepted) {
        options.state = [ BetOrderState.Accepted, BetOrderState.PendingCancel, BetOrderState.CancelFailed ]
        options.isRedeemed = false
        // options.isCashedOut = false
      }
      else if (filter.type === BetType.Settled) {
        options.state = BetOrderState.Settled
      }
      else if (filter.type === BetType.CashedOut) {
        console.warn('cashed out bets filter isn\'t supported yet')

        return {
          bets: [],
          nextPage: undefined,
        }
      }
      else if (filter.type === BetType.Pending) {
        options.state = [ BetOrderState.Created, BetOrderState.Placed, BetOrderState.Sent ]
      }

      let v3Bets = await getBetsByBettor(options)

      if (!v3Bets?.length) {
        return {
          bets: [],
          nextPage: undefined,
        }
      }

      if (filter.type === BetType.Unredeemed) {
        v3Bets = v3Bets.filter((order) => {
          const { result: orderResult, meta: rawBet } = order

          const isAcceptedBetCanceled = getIsAcceptedBetCanceled(order)

          return isAcceptedBetCanceled || (orderResult === BetOrderResult.Won || rawBet?.result === BetResult.Won)
        })
      }

      const gameIds = v3Bets.reduce((acc, order) => {
        order.conditions.forEach((condition) => {
          acc.add(condition.gameId)
        })

        return acc
      }, new Set<string>())

      const games = await getGamesByIds({
        chainId: chain.id,
        gameIds: [...gameIds],
      })

      const gameByGameId = games.reduce((acc, game) => {
        acc[game.gameId] = game

        return acc
      }, {} as Record<string, GameData>)

      const bets = v3Bets.map((order) => {
        const  {
          id: orderId,
          betType, state: orderState, meta: rawBet, core: coreAddress, bonusId: freebetId, isFreebet, odds,
          result: orderResult, affiliate, isSponsoredBetReturnable
        } = order

        const {
          // amount,
          resolvedBlockTimestamp: resolvedAt,
          status, settledOdds,  result, selections,
          cashout: _cashout, payout: _payout,
          paymasterContractAddress,
          redeemedTxHash,
        } = rawBet || {}

        const txHash = order.txHash || rawBet?.createdTxHash
        const isFreebetAmountReturnable = Boolean(rawBet?.isFreebetAmountReturnable || isSponsoredBetReturnable)
        const tokenId = order.betId?.toString() || ''
        const lpAddress = rawBet?.core?.liquidityPool?.address || order.lpAddress
        const actor = rawBet?.actor || order.bettor

        const amount = String(rawBet?.amount || order.amount)
        const createdAt = Math.floor(Date.parse(order.createdAt) / 1000)
        const redeemedAt = order.redeemedAt ? Math.floor(Date.parse(order.redeemedAt) / 1000) : null
        const _isRedeemed = Boolean(rawBet?.isRedeemed || redeemedAt)

        const isWin = orderResult === BetOrderResult.Won || result === BetResult.Won
        const isLose = orderResult === BetOrderResult.Lost || result === BetResult.Lost
        const isAcceptedBetCanceled = getIsAcceptedBetCanceled(order)

        const isRejected = orderState === BetOrderState.Rejected
        const isCanceled = orderResult === BetOrderResult.Canceled || orderState === BetOrderState.Canceled || status === GraphBetStatus.Canceled
        const isCashedOut = Boolean(rawBet?.isCashedOut)
        const isRedeemable = (isWin || isAcceptedBetCanceled) && !_isRedeemed && !isCashedOut
        // express bets have a specific feature - protocol redeems LOST expresses to release liquidity,
        // so we should validate it by "win"/"canceled" statuses
        const isRedeemed = Boolean((isWin || isAcceptedBetCanceled) && _isRedeemed)
        // const isFreebet = Boolean(freebetId)
        const payout = !_isRedeemed && isWin ? +_payout! : null
        const betDiff = isFreebet && isFreebetAmountReturnable ? amount : 0 // for freebet we must exclude bonus value from possible win
        const cashout = isCashedOut ? _cashout?.payout : undefined

        const isCombo = betType === 'COMBO'
        let subBetOdds: number[] = []

        const selectionsByConditionId = selections?.reduce<Record<string, typeof selections[number]>>((acc, selection) => {
          acc[selection.outcome.condition.conditionId] = selection

          return acc
        }, {})

        const outcomes: BetOutcome[] = order.conditions!
          .map((orderCondition, index) => {
            const { gameId, gameState, conditionId, outcomeId, result: conditionStatus, price: selectionOdds } = orderCondition
            const {
              result,
              outcome,
            } = selectionsByConditionId?.[conditionId] || {}

            // @ts-ignore
            const customSelectionName = outcome?.title
            // @ts-ignore
            const customMarketName = outcome?.condition?.title
            const wonOutcomeIds = outcome?.condition?.wonOutcomeIds

            const game = gameByGameId[gameId]!

            const isWin = result ? result === SelectionResult.Won : null
            const isLose = result ? result === SelectionResult.Lost : null
            const isCanceled = !result && conditionStatus === BetConditionStatus.Canceled

            const isLive = gameState === GameState.Live

            if (isCombo && !isCanceled) {
              subBetOdds.push(+selectionOdds)
            }

            const marketName = customMarketName && customMarketName !== 'null' ? customMarketName : getMarketName({ outcomeId })
            const selectionName = customSelectionName && customSelectionName !== 'null' ? customSelectionName : getSelectionName({ outcomeId, withPoint: true })

            return {
              selectionName,
              outcomeId: String(outcomeId),
              conditionId,
              coreAddress,
              odds: +selectionOdds,
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

        const bet: Bet = {
          orderId,
          actor,
          affiliate,
          tokenId,
          orderState,
          isRejected,
          rejectedErrorCode: isRejected ? order.error : null,
          freebetId: freebetId || null,
          isFreebetAmountReturnable: isFreebetAmountReturnable ?? null,
          paymaster: isFreebet ? paymasterContractAddress || contracts?.paymaster?.address || null : null,
          txHash: txHash as Hex || null,
          redeemedTxHash: redeemedTxHash as Hex || null,
          totalOdds,
          status: status || (orderState === BetOrderState.Accepted ? GraphBetStatus.Accepted : null),
          amount,
          possibleWin,
          payout,
          createdAt,
          resolvedAt: resolvedAt ? +resolvedAt : null,
          redeemedAt,
          cashout,
          isWin,
          isLose,
          isRedeemable,
          isRedeemed,
          isCanceled,
          isCashedOut,
          coreAddress,
          lpAddress,
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
    staleTime: 5000,
    ...(query || {}),
  })
}
