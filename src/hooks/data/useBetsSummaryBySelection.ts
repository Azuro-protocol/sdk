import { useMemo } from 'react'
import { type Address, formatUnits, parseUnits } from 'viem'
import {
  ODDS_DECIMALS,
  BetResult,
  GameBetsDocument } from '@azuro-org/toolkit'
import {
  GameStatus,

  type GameBetsQuery,
  type GameBetsQueryVariables,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'

import { useChain } from '../../contexts/chain'


export type BetsSummaryBySelection = Record<string, string>

type Props = {
  account: Address
  gameId: string
  gameStatus: GameStatus
  keyStruct?: 'outcomeId' | 'conditionId-outcomeId'
}

const DIVIDER = 18

export const useBetsSummaryBySelection = ({ account, gameId, gameStatus, keyStruct = 'outcomeId' }: Props) => {
  const { betToken, graphql } = useChain()

  const gqlLink = graphql.prematch

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

      const data = await request<GameBetsQuery, GameBetsQueryVariables>({
        url: gqlLink,
        document: GameBetsDocument,
        variables,
      })

      return data
    },
    enabled: Boolean(account) && gameStatus === GameStatus.Resolved,
  })

  const { bets: prematchBets, liveBets } = data || {}

  const betsSummary = useMemo<BetsSummaryBySelection>(() => {
    if (!prematchBets?.length && !liveBets?.length) {
      return {}
    }

    const rawOne = parseUnits('1', ODDS_DECIMALS)

    const rawSummary = [ ...(prematchBets || []), ...(liveBets || []) ].reduce<Record<string, bigint>>((acc, bet) => {
      const { rawAmount: _rawAmount, rawPotentialPayout: _rawPotentialPayout, result, selections } = bet
      const { freebet } = bet as GameBetsQuery['bets'][0]

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
