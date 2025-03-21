import { useMemo } from 'react'
import { type Address, formatUnits, parseUnits } from 'viem'
import {
  ODDS_DECIMALS,
  BetResult,
  GameBetsDocument } from '@azuro-org/toolkit'
import {
  GameState,

  type GameBetsQuery,
  type GameBetsQueryVariables,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'

import { useChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


export type BetsSummaryBySelection = Record<string, string>

type UseBetsSummaryBySelectionProps = {
  account: Address
  gameId: string
  gameState: GameState
  keyStruct?: 'outcomeId' | 'conditionId-outcomeId'
  query?: QueryParameter<GameBetsQuery>
}

const DIVIDER = 18

export const useBetsSummaryBySelection = (props: UseBetsSummaryBySelectionProps) => {
  const { account, gameId, gameState, keyStruct = 'outcomeId', query = {} } = props

  const { betToken, graphql } = useChain()

  const gqlLink = graphql.bets

  const { data, ...rest } = useQuery({
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
    enabled: Boolean(account) && gameState === GameState.Resolved,
    refetchOnWindowFocus: false,
    ...query,
  })

  const { bets: prematchBets, liveBets } = data || {}

  const betsSummary = useMemo<BetsSummaryBySelection>(() => {
    if (!prematchBets?.length && !liveBets?.length) {
      return {}
    }

    const rawOne = parseUnits('1', ODDS_DECIMALS)

    const rawSummary = [ ...(prematchBets || []), ...(liveBets || []) ].reduce<Record<string, bigint>>((acc, bet) => {
      const { rawAmount: _rawAmount, rawPotentialPayout: _rawPotentialPayout, result, selections, isCashedOut } = bet
      const { freebet } = bet as GameBetsQuery['bets'][0]

      if (isCashedOut) {
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

          rawOddsSummary += BigInt(rawOdds) - rawOne
        })
      }

      selections.forEach(selection => {
        const { outcome: { outcomeId, condition: { conditionId } } } = selection

        if (isExpress) {
          const { outcome: { condition: { game: { gameId: _gameId } } } } = selection as GameBetsQuery['bets'][0]['selections'][0]

          if (gameId !== _gameId) {
            return
          }
        }

        let key = outcomeId

        if (keyStruct === 'conditionId-outcomeId') {
          key = `${conditionId}-${outcomeId}`
        }

        if (!acc[key]) {
          acc[key] = 0n
        }

        if (isExpress) {
          const { rawOdds } = selection as GameBetsQuery['bets'][0]['selections'][0]

          const rawSubBetOdds = parseUnits(String(BigInt(rawOdds) - rawOne), DIVIDER)
          const rawSubBetAmount = rawAmount * ( rawSubBetOdds / rawOddsSummary )

          acc[key]! += isWin ? rawSubBetAmount * BigInt(rawOdds) : -rawSubBetAmount
        }
        else {
          acc[key]! += parseUnits(String(isWin ? rawPayout : -rawAmount), DIVIDER)
        }
      })

      return acc
    }, {})

    return Object.keys(rawSummary).reduce<Record<string, string>>((acc, key) => {
      acc[key] = formatUnits(rawSummary[key]!, betToken.decimals + DIVIDER)

      return acc
    }, {})
  }, [ prematchBets, liveBets ])

  return {
    data: betsSummary,
    ...rest,
  }
}
