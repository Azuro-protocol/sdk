import { type TransactionReceipt, type Address, formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { BetFragmentDoc as PrematchBetFragmentDoc, type BetFragment as PrematchBetFragment } from '../docs/prematch/fragments/bet'
import { LiveBetFragmentDoc, type LiveBetFragment } from '../docs/prematch/fragments/liveBet'
import { MainGameInfoFragmentDoc, type MainGameInfoFragment } from '../docs/prematch/fragments/mainGameInfo'
import { type BettorFragment, BettorFragmentDoc } from '../docs/prematch/fragments/bettor'
import {
  type ConditionFragment as PrematchConditionFragment,
  ConditionFragmentDoc as PrematchConditionFragmentDoc,
} from '../docs/prematch/fragments/condition'
import {
  type ConditionFragment as LiveConditionFragment,
  ConditionFragmentDoc as LiveConditionFragmentDoc,
} from '../docs/live/fragments/condition'
import {
  type ConditionQuery as LiveConditionQuery,
  ConditionDocument as LiveConditionDocument,
} from '../docs/live/condition'
import { ConditionStatus, BetStatus, BetResult } from '../docs/prematch/types'
import { useApolloClients } from '../contexts/apollo'
import { getEventArgsFromTxReceipt } from '../helpers'
import { useChain } from '../contexts/chain'
import { ODDS_DECIMALS, liveHostAddress } from '../config'
import type { Selection } from '../global'
import { liveCoreAbi } from '../abis'


type UpdateBetProps = {
  coreAddress: Address
  tokenId: string | bigint
}

type NewBetProps = {
  bet: {
    rawAmount: bigint
    selections: Selection[]
    odds: Record<string, number>
    freebetId?: string | bigint
    freebetContractAddress?: Address
  }
  affiliate: Address
  receipt: TransactionReceipt
}

export const useBetsCache = () => {
  const { prematchClient, liveClient } = useApolloClients()
  const { contracts, betToken } = useChain()
  const { address } = useAccount()

  const updateBetCache = (
    { coreAddress, tokenId }: UpdateBetProps,
    values: Partial<PrematchBetFragment> | Partial<LiveBetFragment>
  ) => {
    const isLive = contracts.liveCore ? coreAddress.toLowerCase() === contracts.liveCore.address.toLowerCase() : false
    const { cache } = prematchClient!

    const betEntityId = `${coreAddress.toLowerCase()}_${tokenId}`
    let bet: LiveBetFragment | PrematchBetFragment | null

    if (isLive) {
      bet = cache.updateFragment<LiveBetFragment>({
        id: cache.identify({ __typename: 'LiveBet', id: betEntityId }),
        fragment: LiveBetFragmentDoc,
        fragmentName: 'LiveBet',
      }, (data) => ({
        ...data as LiveBetFragment,
        ...values as LiveBetFragment,
      }))

    }
    else {
      bet = cache.updateFragment<PrematchBetFragment>({
        id: cache.identify({ __typename: 'Bet', id: betEntityId }),
        fragment: PrematchBetFragmentDoc,
        fragmentName: 'Bet',
      }, (data) => ({
        ...data as PrematchBetFragment,
        ...values as PrematchBetFragment,
      }))
    }

    if (!bet) {
      return
    }

    const bettorEntity = `${contracts.lp.address.toLowerCase()}_${address!.toLowerCase()}_${bet.affiliate!.toLowerCase()}`

    prematchClient.cache.updateFragment<BettorFragment>({
      id: prematchClient.cache.identify({ __typename: 'Bettor', id: bettorEntity }),
      fragment: BettorFragmentDoc,
      fragmentName: 'Bettor',
    }, (data) => {
      if (!data) {
        return data
      }

      const rawPayout = parseUnits(bet!.payout!, betToken.decimals)
      const newRawToPayout = BigInt(data.rawToPayout) - rawPayout

      return {
        ...data,
        rawToPayout: String(newRawToPayout),
      }
    })
  }

  const addBet = async (props: NewBetProps) => {
    const { bet, affiliate, receipt } = props
    const { rawAmount, selections, odds } = bet

    const coreAddress = selections[0]!.coreAddress
    const isLive = coreAddress.toLowerCase() === liveHostAddress.toLowerCase()
    const client = isLive ? liveClient : prematchClient
    const { cache } = client!

    const selectionFragments: Array<PrematchBetFragment['selections'][0] | LiveBetFragment['selections'][0]> = []

    for (let index = 0; index < selections.length; index++) {
      const { outcomeId, conditionId: _conditionId } = selections[index]!
      const conditionId = String(_conditionId)

      if (isLive) {
        let condition = cache.readFragment<LiveConditionFragment>({
          id: cache.identify({ __typename: 'Condition', id: conditionId }),
          fragment: LiveConditionFragmentDoc,
          fragmentName: 'Condition',
        })

        if (!condition) {
          const { data: { condition: _condition } } = await client!.query<LiveConditionQuery>({
            query: LiveConditionDocument,
            variables: {
              conditionId,
            },
            fetchPolicy: 'network-only',
          })
          condition = _condition!
        }

        const gameId = condition!.game.gameId

        const selectionFragment: LiveBetFragment['selections'][0] = {
          __typename: 'LiveSelection',
          odds: String(odds[`${conditionId}-${outcomeId}`]),
          result: null,
          outcome: {
            __typename: 'LiveOutcome',
            outcomeId: String(outcomeId),
            condition: {
              __typename: 'LiveCondition',
              conditionId,
              status: ConditionStatus.Created,
              gameId,
            },
          },
        } as const

        selectionFragments.push(selectionFragment)
      }
      else {
        const conditionEntityId = `${coreAddress.toLowerCase()}_${conditionId}`
        const condition = cache.readFragment<PrematchConditionFragment>({
          id: cache.identify({ __typename: 'Condition', id: conditionEntityId }),
          fragment: PrematchConditionFragmentDoc,
          fragmentName: 'Condition',
        })

        const gameId = condition?.game.gameId

        const gameEntityId = `${contracts.lp.address.toLowerCase()}_${gameId}`

        const game = cache.readFragment<MainGameInfoFragment>({
          id: cache.identify({ __typename: 'Game', id: gameEntityId }),
          fragment: MainGameInfoFragmentDoc,
          fragmentName: 'MainGameInfo',
        })

        // it's possible that we don't have a game in graphql cache,
        // let's try to invalidate query and hope on update from the server
        if (!game) {
          setTimeout(() => {
            client!.refetchQueries({
              include: [ 'Bets' ],
            })
          }, 1500)

          return
        }

        const selectionFragment: PrematchBetFragment['selections'][0] = {
          __typename: 'Selection',
          odds: String(odds[`${conditionId}-${outcomeId}`]),
          result: null,
          outcome: {
            __typename: 'Outcome',
            outcomeId: String(outcomeId),
            condition: {
              __typename: 'Condition',
              conditionId,
              status: ConditionStatus.Created,
              game,
            },
          },
        } as const

        selectionFragments.push(selectionFragment)
      }
    }

    let tokenId: string
    let rawOdds: bigint

    if (isLive) {
      const receiptArgs = getEventArgsFromTxReceipt({ receipt, eventName: 'NewLiveBet', abi: liveCoreAbi })

      tokenId = (receiptArgs?.tokenId).toString()
      rawOdds = receiptArgs?.odds
    }
    else {
      const isExpress = selections.length > 1
      const abi = isExpress ? contracts.prematchComboCore.abi : contracts.prematchCore.abi
      let params

      if (!isExpress) {
        const { conditionId, outcomeId } = selections[0]!
        params = {
          conditionId: BigInt(conditionId),
          outcomeId: BigInt(outcomeId),
        }
      }

      const receiptArgs = getEventArgsFromTxReceipt({
        receipt,
        eventName: 'NewBet',
        abi,
        params,
      })

      tokenId = (isExpress ? receiptArgs?.betId : receiptArgs?.tokenId)?.toString()
      rawOdds = isExpress ? receiptArgs?.bet.odds : receiptArgs?.odds
    }

    const rawPotentialPayout = rawAmount * rawOdds

    const potentialPayout = formatUnits(rawPotentialPayout, betToken.decimals)
    const finalOdds = formatUnits(rawOdds, ODDS_DECIMALS)
    const amount = formatUnits(rawAmount, betToken.decimals)

    if (isLive) {
      prematchClient!.cache.modify({
        id: prematchClient!.cache.identify({ __typename: 'Query' }),
        fields: {
          liveBets: (bets) => {
            const betEntityId = `${coreAddress.toLowerCase()}_${tokenId}`

            const data: LiveBetFragment = {
              __typename: 'LiveBet',
              id: betEntityId,
              tokenId: tokenId,
              core: {
                address: coreAddress,
                liquidityPool: {
                  address: contracts.lp.address,
                },
              },
              status: BetStatus.Accepted,
              amount,
              odds: finalOdds,
              settledOdds: null,
              createdAt: String(Math.floor(Date.now() / 1000)),
              payout: null,
              potentialPayout: potentialPayout,
              isRedeemed: false,
              isRedeemable: false,
              result: null,
              txHash: receipt.transactionHash,
              affiliate,
              selections: selectionFragments as LiveBetFragment['selections'],
            }

            const newBet = prematchClient!.cache.writeFragment<LiveBetFragment>({
              fragment: LiveBetFragmentDoc,
              fragmentName: 'LiveBet',
              data,
            })

            return [ newBet, ...bets ]
          },
        },
      })
    }
    else {
      prematchClient!.cache.modify({
        id: prematchClient!.cache.identify({ __typename: 'Query' }),
        fields: {
          bets: (bets) => {
            const betEntityId = `${coreAddress.toLowerCase()}_${tokenId}`

            const data: PrematchBetFragment = {
              __typename: 'Bet',
              id: betEntityId,
              tokenId: tokenId,
              core: {
                address: coreAddress,
                liquidityPool: {
                  address: contracts.lp.address,
                },
              },
              status: BetStatus.Accepted,
              amount,
              odds: finalOdds,
              settledOdds: null,
              createdAt: String(Math.floor(Date.now() / 1000)),
              payout: null,
              potentialPayout: potentialPayout,
              isRedeemed: false,
              isRedeemable: false,
              freebet: bet.freebetContractAddress ? {
                freebetId: String(bet.freebetId),
                contractAddress: bet.freebetContractAddress,
              } : null,
              result: null,
              txHash: receipt.transactionHash,
              affiliate,
              selections: selectionFragments as PrematchBetFragment['selections'],
            }

            const newBet = prematchClient!.cache.writeFragment<PrematchBetFragment>({
              fragment: PrematchBetFragmentDoc,
              fragmentName: 'Bet',
              data,
            })

            return [ newBet, ...bets ]
          },
        },
      })
    }

    const bettorEntity = `${contracts.lp.address.toLowerCase()}_${address!.toLowerCase()}_${affiliate.toLowerCase()}`

    const bettorFragment = cache.readFragment<BettorFragment>({
      id: cache.identify({ __typename: 'Bettor', id: bettorEntity }),
      fragment: BettorFragmentDoc,
      fragmentName: 'Bettor',
    })

    if (bettorFragment) {
      prematchClient.cache.updateFragment<BettorFragment>({
        id: prematchClient.cache.identify({ __typename: 'Bettor', id: bettorEntity }),
        fragment: BettorFragmentDoc,
        fragmentName: 'Bettor',
      }, (data) => ({
        ...data as BettorFragment,
        betsCount: data!.betsCount + 1,
        rawInBets: String(BigInt(data!.rawInBets) + rawAmount),
      }))
    }
    else {
      prematchClient!.cache.modify({
        id: prematchClient!.cache.identify({ __typename: 'Query' }),
        fields: {
          bettors: (bettors) => {
            const newBettor = prematchClient!.cache.writeFragment<BettorFragment>({
              fragment: BettorFragmentDoc,
              fragmentName: 'Bettor',
              data: {
                __typename: 'Bettor',
                id: bettorEntity,
                rawToPayout: '0',
                rawInBets: String(rawAmount),
                rawTotalPayout: '0',
                rawTotalProfit: '0',
                betsCount: 1,
                wonBetsCount: 0,
                lostBetsCount: 0,
              },
            })

            return [ ...bettors, newBettor ]
          },
        },
      })
    }
  }

  return {
    updateBetCache,
    addBet,
  }
}
