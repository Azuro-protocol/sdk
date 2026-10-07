import { useCallback } from 'react'
import { type Address, formatUnits, parseUnits } from 'viem'
import {
  type GameBetsQuery,
  type GameBetsQueryVariables,
  type ChainId,

  ODDS_DECIMALS,
  BetResult,
  GameBetsDocument,
  GameState,
  calcFreebetBettorShare,
} from '@azuro-org/toolkit'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


export type UseBetsSummaryBySelectionProps = {
  account: Address
  gameId: string
  gameState: GameState
  chainId?: ChainId
  query?: QueryParameter<GameBetsQuery>
}

export type UseBetsSummaryBySelection = (props: UseBetsSummaryBySelectionProps) => UseQueryResult<Record<string, string>>

/**
 * Get a betting summary by selection (outcome) for a specific game.
 * Returns a map of `${conditionId}-${outcomeId}` to the profit/loss on that selection. Only enabled for
 * finished games. For a freebet, a win counts the bettor's share of the payout and a loss counts 0, since
 * the bettor staked none of their own funds.
 *
 * An outcome is addressed by its condition and its id together - an `outcomeId` alone is not unique
 * across a game, so the same one can belong to more than one condition.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useBetsSummaryBySelection
 *
 * @example
 * import { useBetsSummaryBySelection, GameState } from '@azuro-org/sdk'
 *
 * const { data, isFetching } = useBetsSummaryBySelection({
 *   account: '0x...',
 *   gameId: '123',
 *   gameState: GameState.Finished
 * })
 * // data: { '456-1': '100.5', '789-2': '-50.25' } - `${conditionId}-${outcomeId}` -> profit/loss
 * */

const DIVIDER = 18
const RAW_ONE = parseUnits('1', ODDS_DECIMALS)

export const useBetsSummaryBySelection: UseBetsSummaryBySelection = (props) => {
  const { account, gameId, gameState, chainId, query = {} } = props

  const { betToken, graphql } = useOptionalChain(chainId)

  const gqlLink = graphql.bets

  const formatData = useCallback(({ bets: prematchBets, liveBets, v3Bets }: GameBetsQuery) => {

    const rawSummary = [ ...(prematchBets || []), ...(liveBets || []), ...(v3Bets || []) ].reduce<Record<string, bigint>>((acc, bet) => {
      const { rawAmount: _rawAmount, rawPotentialPayout: _rawPotentialPayout, result, selections, isCashedOut } = bet
      const { freebet } = bet as GameBetsQuery['bets'][0]
      // a v2 bet has no returnable flag, so a legacy freebet is valued as returnable
      const { isFreebetAmountReturnable } = bet as GameBetsQuery['v3Bets'][0]

      if (isCashedOut || !result) {
        return acc
      }

      const isExpress = selections.length > 1
      const isWin = result === BetResult.Won
      const isFreebet = Boolean(freebet)

      const rawAmount = BigInt(_rawAmount)
      const rawPayout = BigInt(_rawPotentialPayout)
      // a won freebet pays the bettor only their share, a lost one costs them nothing
      const rawFreebetShare = isFreebet && isWin
        ? calcFreebetBettorShare({
          payout: rawPayout,
          amount: rawAmount,
          isAmountReturnable: isFreebetAmountReturnable,
        })
        : 0n

      let rawOddsSummary = 0n

      if (isExpress) {
        selections.forEach(selection => {
          const { rawOdds } = selection as GameBetsQuery['bets'][0]['selections'][0]

          rawOddsSummary += BigInt(rawOdds) - RAW_ONE
        })
      }

      selections.forEach(selection => {
        const { outcome: { outcomeId, condition: { conditionId } } } = selection

        if (isExpress) {
          const _gameId = (
            (selection as GameBetsQuery['bets'][0]['selections'][0]).outcome.condition?.game?.gameId
          ) || (
            (selection as GameBetsQuery['v3Bets'][0]['selections'][0]).outcome.condition?.gameId
          )

          if (gameId !== _gameId) {
            return
          }
        }

        const key = `${conditionId}-${outcomeId}`

        if (!acc[key]) {
          acc[key] = 0n
        }

        if (isExpress) {
          const { rawOdds: _rawOdds } = selection as GameBetsQuery['bets'][0]['selections'][0]

          const rawOdds = BigInt(_rawOdds)
          const rawSubBetOdds = parseUnits(String(rawOdds - RAW_ONE), DIVIDER)
          const rawPartialOdds = rawSubBetOdds / rawOddsSummary / BigInt(10 ** (DIVIDER - ODDS_DECIMALS))

          if (isFreebet) {
            acc[key]! += rawFreebetShare * rawPartialOdds / BigInt(10 ** ODDS_DECIMALS)

            return
          }

          const rawSubBetAmount = rawAmount * rawPartialOdds / BigInt(10 ** ODDS_DECIMALS)

          if (isWin) {
            acc[key]! += rawSubBetAmount * rawOdds / BigInt(10 ** ODDS_DECIMALS)
          }
          else {
            acc[key]! -= rawSubBetAmount
          }
        }
        else if (isFreebet) {
          acc[key]! += rawFreebetShare
        }
        else {
          acc[key]! += isWin ? rawPayout : -rawAmount
        }
      })

      return acc
    }, {})

    return Object.keys(rawSummary).reduce<Record<string, string>>((acc, key) => {
      acc[key] = formatUnits(rawSummary[key]!, betToken.decimals)

      return acc
    }, {})
  }, [ gameId, betToken.decimals ])

  const accountLowerCased = account?.toLowerCase()

  return useQuery({
    queryKey: [
      'bets-summary-by-selection',
      gqlLink,
      accountLowerCased,
      gameId,
    ],
    queryFn: async () => {
      const variables: GameBetsQueryVariables = {
        actor: accountLowerCased,
        gameId,
      }

      const data = await gqlRequest<GameBetsQuery, GameBetsQueryVariables>({
        url: gqlLink,
        document: GameBetsDocument,
        variables,
      })

      return data
    },
    enabled: Boolean(account) && gameState === GameState.Finished,
    refetchOnWindowFocus: false,
    select: formatData,
    ...query,
  })
}
