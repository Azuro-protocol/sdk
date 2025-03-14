import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { type Address, formatUnits, parseUnits } from 'viem'
import {
  ODDS_DECIMALS,
  GameStatus,
  BetResult,

  type GameBetsQuery,
  type GameBetsQueryVariables,
  GameBetsDocument,
} from '@azuro-org/toolkit'

import { useApolloClients } from '../../contexts/apollo'
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
  const { prematchClient } = useApolloClients()
  const { betToken } = useChain()

  const variables = useMemo<GameBetsQueryVariables>(() => ({
    actor: account?.toLowerCase(),
    gameId,
  }), [ account, gameId ])

  const { data, loading, error } = useQuery<GameBetsQuery, GameBetsQueryVariables>(GameBetsDocument, {
    variables,
    ssr: false,
    client: prematchClient!,
    skip: !account || gameStatus !== GameStatus.Resolved,
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
          const { rawOdds: _rawOdds } = selection as GameBetsQuery['bets'][0]['selections'][0]

          const rawOdds = BigInt(_rawOdds)
          const rawSubBetOdds = parseUnits(String(rawOdds - rawOne), DIVIDER)
          const rawPartialOdds = rawSubBetOdds / rawOddsSummary / BigInt(10 ** (DIVIDER - ODDS_DECIMALS))
          const rawSubBetAmount = rawAmount * rawPartialOdds / BigInt(10 ** ODDS_DECIMALS)

          if (isWin) {
            acc[key]! += rawSubBetAmount * rawOdds / BigInt(10 ** ODDS_DECIMALS)
          }
          else {
            acc[key]! += rawSubBetAmount
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
  }, [ prematchBets, liveBets ])

  return {
    betsSummary,
    loading,
    error,
  }
}
