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

      if (isCashedOut || !result) {
        return acc
      }

      const isExpress = selections.length > 1
      const isWin = result === BetResult.Won

      const rawAmount = BigInt(_rawAmount)
      const rawBetDiff = freebet ? rawAmount : 0n
      const rawPayout = BigInt(_rawPotentialPayout) - rawBetDiff

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

        const key = outcomeId

        if (!acc[key]) {
          acc[key] = 0n
        }

        if (isExpress) {
          const { rawOdds: _rawOdds } = selection as GameBetsQuery['bets'][0]['selections'][0]

          const rawOdds = BigInt(_rawOdds)
          const rawSubBetOdds = parseUnits(String(rawOdds - RAW_ONE), DIVIDER)
          const rawPartialOdds = rawSubBetOdds / rawOddsSummary / BigInt(10 ** (DIVIDER - ODDS_DECIMALS))
          const rawSubBetAmount = rawAmount * rawPartialOdds / BigInt(10 ** ODDS_DECIMALS)

          if (isWin) {
            acc[key]! += rawSubBetAmount * rawOdds / BigInt(10 ** ODDS_DECIMALS)
          }
          else {
            acc[key]! -= rawSubBetAmount
          }
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
  }, [])

  return useQuery({
    queryKey: [
      'bets-summary-by-selection',
      gqlLink,
      account,
      gameId,
    ],
    queryFn: async () => {
      const variables: GameBetsQueryVariables = {
        actor: account?.toLowerCase(),
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
