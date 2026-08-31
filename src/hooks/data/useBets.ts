import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'
import {
  BetConditionStatus, BetResult, BetOrderState, calcComboOdds, MARGIN_APPLIED_AT, type ChainId,
  type GameData, GameState, getGamesByIds, GraphBetStatus, OrderDirection,
  getBetsByBettor, type GetBetsByBettorParams, type GetBetsByBettorResult,
  SelectionKind, SelectionResult, OutcomeResult, BetOrderResult,
} from '@azuro-org/toolkit'
import { type InfiniteData, useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query'
import { type Address, type Hex } from 'viem'

import { batchFetchConditions } from '../../helpers/batchFetchConditions'
import { useOptionalChain } from '../../contexts/chain'
import { type Bet, type BetOutcome, BetType, type InfiniteQueryParameters } from '../../global'


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

      const { gameIds, conditionV5Ids } = v3Bets.reduce((acc, order) => {
        order.conditions.forEach((condition, index) => {
          acc.gameIds.add(condition.gameId)

          // @ts-expect-error
          if (condition.conditionId[0] === '5' && !condition.title && !order.meta?.selections?.[index]?.outcome?.condition?.title) {
            conditionV5Ids.add(condition.conditionId)
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

      const bets = v3Bets.map((order) => {
        const {
          id: orderId,
          betType, state: orderState, meta: rawBet, core: coreAddress, bonusId: freebetId, isFreebet, odds,
          result: orderResult, affiliate, isSponsoredBetReturnable,
        } = order

        const {
          // amount,
          resolvedBlockTimestamp: resolvedAt,
          status, settledOdds, result, selections,
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
        // the on-chain moment the bet was placed, which is what decides whether its odds carry the
        // feed's fee - `order.createdAt` is the order record's own timestamp and can fall on the
        // other side of `MARGIN_APPLIED_AT` from the block that priced the bet. It is only used as a
        // fallback, for an order the subgraph has not indexed yet
        const createdAt = rawBet?.createdBlockTimestamp
          ? Number(rawBet.createdBlockTimestamp)
          : Math.floor(Date.parse(order.createdAt) / 1000)
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
            const _customSelectionName = outcome?.title
            // @ts-ignore
            const _customMarketName = outcome?.condition?.title
            // per-outcome settlement lives on the condition's outcome list, keyed by outcome id
            const outcomeResult = outcome?.condition?.outcomes
              ?.find(item => item.outcomeId === String(outcomeId))?.result

            const game = gameByGameId[gameId]!

            // Resolution is per-outcome now: a single leg can be voided while its condition stays
            // `Resolved`, so the outcome's own `result` is the authoritative settlement signal.
            // `selection.result` is the subgraph's newer per-selection signal and is only populated
            // for data indexed after the fix, so it can't replace either of the other two checks.
            // Widened to `string` because the generated `SelectionResult` enum has no `Canceled`
            // member yet even though the subgraph already returns the value.
            const selectionResult: string | null | undefined = result
            const isCanceled = outcomeResult === OutcomeResult.Canceled
              || selectionResult === OutcomeResult.Canceled
              // legacy fallback: whole-condition cancels, which predate per-outcome results
              || (!result && conditionStatus === BetConditionStatus.Canceled)

            // won / lost / void / pending must stay mutually exclusive, so a voided leg reports
            // `false` (settled, no winnings) rather than `null` (still pending).
            const isWin = isCanceled ? false
              : outcomeResult ? outcomeResult === OutcomeResult.Won
                : result ? result === SelectionResult.Won : null
            const isLose = isCanceled ? false
              : outcomeResult ? outcomeResult === OutcomeResult.Lost
                : result ? result === SelectionResult.Lost : null

            const isLive = gameState === GameState.Live

            if (isCombo && !isCanceled) {
              subBetOdds.push(+selectionOdds)
            }

            const isConditionV5 = conditionId[0] === '5'

            const customSelectionName = _customSelectionName && _customSelectionName !== 'null'
              ? _customSelectionName
              : conditionsFeedData?.[conditionId]?.outcomes[outcomeId]?.title as string | undefined

            const customMarketName = _customMarketName && _customMarketName !== 'null'
              ? _customMarketName
              : conditionsFeedData?.[conditionId]?.title as string | undefined

            const marketName = isConditionV5
              ? customMarketName || 'missed_market_title'
              : customMarketName || getMarketName({ outcomeId })

            const selectionName = isConditionV5
              ? customSelectionName || 'missed_outcome_title'
              : customSelectionName || getSelectionName({ outcomeId, withPoint: true })

            return {
              selectionName,
              outcomeId: String(outcomeId),
              conditionId,
              coreAddress,
              odds: +selectionOdds,
              marketName,
              game,
              isWin,
              isLose,
              isCanceled,
              isLive,
            }
          })
          .sort((a, b) => +(a.game?.startsAt || 0) - +(b.game?.startsAt || 0))

        // A combo placed before the feed applied its fee to every outcome was priced as the plain
        // product of its legs, which is exactly what the indexer records - so both its recorded odds
        // and its recorded payout are right, until a voided leg has to come out of them.
        const isPricedAsRecorded = isCombo
          && createdAt < MARGIN_APPLIED_AT
          && subBetOdds.length === order.conditions!.length

        // `calcComboOdds` prices a combo the way the protocol does, by the rules in force when the
        // bet was placed. It answers 1 for an empty leg list, so an all-void combo returns the stake
        // rather than 0.99 of it.
        // a fully canceled bet returns the stake, nothing more - `settledOdds` keeps the odds it was
        // placed at even then, so it must not be used here
        let totalOdds = isCanceled ? 1
          : isCombo && !isPricedAsRecorded
            ? +calcComboOdds({ odds: subBetOdds, createdAt })
            : settledOdds ? +settledOdds : +odds

        const rebuiltPayout = +amount * totalOdds
        const possibleWin = rebuiltPayout - +betDiff

        /**
         * The recorded payout of an unredeemed won combo is not what the bet is worth. The indexer
         * writes it at settlement by multiplying the leg odds as it recorded them, and only replaces
         * it with the real on-chain amount when the bettor claims - so it compounds the feed's fee
         * once per leg instead of once in total, and it keeps crediting a voided leg as if that leg
         * had won. Redeemed bets keep reading the recorded value: by then it is the amount actually
         * paid. A combo whose legs predate the fee is the exception, per `isPricedAsRecorded`, and so
         * is a cashed-out bet: it was paid at the price the bettor took, so its odds say nothing
         * about it.
         * */
        const isRecordedPayoutStale = isWin && isCombo && !isCashedOut && !_isRedeemed
          && !isPricedAsRecorded

        const recordedPayout = _payout !== null && _payout !== undefined ? +_payout : null
        const actualPayout = isRecordedPayoutStale ? rebuiltPayout : recordedPayout

        // `payout` is deliberately gated on redeemability: it answers "is there money to claim?", so
        // it reads the same gate rather than a second opinion on it. A canceled bet refunds the stake,
        // so it has money to claim too; a cashed-out one does not, whatever it later resolves to.
        const payout = isRedeemable ? actualPayout : null
        // `settledPayout` answers "what did this bet return?" and stays populated after redemption,
        // which is what historical and aggregate views need
        const settledPayout = actualPayout

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
          settledPayout,
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
