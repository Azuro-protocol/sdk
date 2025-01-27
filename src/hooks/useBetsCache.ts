import { type TransactionReceipt, type Address, formatUnits, parseUnits } from 'viem'
import {
  type Selection,
  ODDS_DECIMALS,
  liveHostAddress,
  liveCoreAbi,
  ConditionStatus,
  GraphBetStatus,

  type PrematchBetFragment,
  PrematchBetFragmentDoc,

  type LiveBetFragment,
  LiveBetFragmentDoc,

  type MainGameInfoFragment,
  MainGameInfoFragmentDoc,

  type BettorFragment,
  BettorFragmentDoc,

  type PrematchConditionFragment,
  PrematchConditionFragmentDoc,

  type LiveConditionFragment,
  LiveConditionFragmentDoc,

  type LiveConditionQuery,
  LiveConditionDocument,

  type PrematchConditionQuery,
  PrematchConditionDocument,

  type GameQuery,
  GameDocument,
} from '@azuro-org/toolkit'

import { useApolloClients } from '../contexts/apollo'
import { getEventArgsFromTxReceipt } from '../helpers'
import { useChain } from '../contexts/chain'
import { useExtendedAccount } from '../hooks/useAaConnector'


type UpdateBetProps = {
  coreAddress: Address
  tokenId: string | bigint
}

export type NewBetProps = {
  bet: {
    rawAmount: bigint
    selections: Selection[]
    freebetId?: string | bigint
    freebetContractAddress?: Address
  }
  odds: Record<string, number>
  affiliate: Address
  receipt: TransactionReceipt
}

export const useBetsCache = () => {
  const { prematchClient, liveClient } = useApolloClients()
  const { contracts, betToken } = useChain()
  const { address } = useExtendedAccount()

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

      if (values.isCashedOut) {
        prematchClient!.cache.modify({
          id: prematchClient!.cache.identify({ __typename: 'Query' }),
          fields: {
            liveBets: (bets, { storeFieldName, toReference }) => {
              const isValidStorage = (
                values.isCashedOut && storeFieldName.includes('"isCashedOut":true') // BetType.CashedOut
              )

              if (!isValidStorage) {
                return bets
              }

              return [ toReference(bet!), ...bets ]
            },
          },
        })
      }
    }
    else {
      bet = cache.updateFragment<PrematchBetFragment>({
        id: cache.identify({ __typename: 'Bet', id: betEntityId }),
        fragment: PrematchBetFragmentDoc,
        fragmentName: 'PrematchBet',
      }, (data) => ({
        ...data as PrematchBetFragment,
        ...values as PrematchBetFragment,
      }))

      if (values.isCashedOut) {
        prematchClient!.cache.modify({
          id: prematchClient!.cache.identify({ __typename: 'Query' }),
          fields: {
            bets: (bets, { storeFieldName, toReference }) => {
              const isValidStorage = (
                values.isCashedOut && storeFieldName.includes('"isCashedOut":true') // BetType.CashedOut
              )

              if (!isValidStorage) {
                return bets
              }

              return [ toReference(bet!), ...bets ]
            },
          },
        })
      }
    }

    if (!bet || !bet.payout) {
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
    const { bet, odds, affiliate, receipt } = props
    const { rawAmount, selections, freebetId } = bet

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
          fragmentName: 'LiveCondition',
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
        let condition = cache.readFragment<PrematchConditionFragment>({
          id: cache.identify({ __typename: 'Condition', id: conditionEntityId }),
          fragment: PrematchConditionFragmentDoc,
          fragmentName: 'PrematchCondition',
        })

        if (!condition) {
          const { data: { condition: _condition } } = await client!.query<PrematchConditionQuery>({
            query: PrematchConditionDocument,
            variables: {
              id: conditionEntityId,
            },
            fetchPolicy: 'network-only',
          })
          condition = _condition!
        }

        const outcome = condition.outcomes.find((outcome) => outcome.outcomeId === outcomeId)!
        const gameId = condition?.game.gameId

        const gameEntityId = `${contracts.lp.address.toLowerCase()}_${gameId}`

        let game = cache.readFragment<MainGameInfoFragment>({
          id: cache.identify({ __typename: 'Game', id: gameEntityId }),
          fragment: MainGameInfoFragmentDoc,
          fragmentName: 'MainGameInfo',
        })

        if (!game) {
          const { data: { games } } = await client!.query<GameQuery>({
            query: GameDocument,
            variables: {
              gameId,
            },
            fetchPolicy: 'network-only',
          })

          game = games[0]!
        }

        const selectionFragment: PrematchBetFragment['selections'][0] = {
          __typename: 'Selection',
          odds: String(odds[`${conditionId}-${outcomeId}`]),
          result: null,
          outcome: {
            __typename: 'Outcome',
            outcomeId: String(outcomeId),
            title: outcome.title,
            condition: {
              __typename: 'Condition',
              conditionId,
              status: ConditionStatus.Created,
              title: condition.title,
              game,
            },
          },
        } as const

        selectionFragments.push(selectionFragment)
      }
    }

    let tokenId: string
    let rawOdds: bigint = 0n

    if (isLive) {
      const receiptArgs = getEventArgsFromTxReceipt({ receipt, eventName: 'NewLiveBet', abi: liveCoreAbi })

      tokenId = (receiptArgs?.tokenId!).toString()
      rawOdds = receiptArgs?.odds!
    }
    // we don't need additional for freeBet cause it triggers NewBet event on prematch core
    else {
      const isExpress = selections.length > 1

      if (isExpress) {

        const receiptArgs = getEventArgsFromTxReceipt({
          receipt,
          eventName: 'NewBet',
          abi: contracts.prematchComboCore.abi,
        })

        tokenId = receiptArgs?.betId.toString()!
        rawOdds = receiptArgs?.bet.odds!
      }
      else {
        const { conditionId, outcomeId } = selections[0]!
        const eventParams = {
          conditionId: BigInt(conditionId),
          outcomeId: BigInt(outcomeId),
        }

        const receiptArgs = getEventArgsFromTxReceipt({
          receipt,
          eventName: 'NewBet',
          abi: contracts.prematchCore.abi,
          params: eventParams,
        })

        tokenId = receiptArgs?.tokenId.toString()!
        rawOdds = receiptArgs?.odds!
      }
    }

    const rawPotentialPayout = rawAmount * rawOdds

    const potentialPayout = formatUnits(rawPotentialPayout, betToken.decimals)
    const finalOdds = formatUnits(rawOdds, ODDS_DECIMALS)
    const amount = formatUnits(rawAmount, betToken.decimals)

    const actorArg = `"actor":"${address!.toLowerCase()}"`
    const affiliateArg = `"affiliate":"${affiliate}"`

    if (isLive) {
      prematchClient!.cache.modify({
        id: prematchClient!.cache.identify({ __typename: 'Query' }),
        fields: {
          liveBets: (bets, { storeFieldName }) => {
            const isValidStorage = (
              storeFieldName.includes(`{${actorArg}}`) || // all bets
              storeFieldName.includes(`{${actorArg},${affiliateArg}}`) || // all bets with affiliate
              (storeFieldName.includes(actorArg) && storeFieldName.includes('"status":"Accepted"')) // BetType.Accepted
            )

            if (!isValidStorage) {
              return bets
            }

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
              status: GraphBetStatus.Accepted,
              amount,
              odds: finalOdds,
              settledOdds: null,
              createdAt: String(Math.floor(Date.now() / 1000)),
              payout: null,
              potentialPayout: potentialPayout,
              result: null,
              cashout: null,
              txHash: receipt.transactionHash,
              affiliate,
              selections: selectionFragments as LiveBetFragment['selections'],
              isRedeemed: false,
              isRedeemable: false,
              isCashedOut: false,
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
          bets: (bets, { storeFieldName }) => {
            const isValidStorage = (
              storeFieldName.includes(`{${actorArg}}`) || // all bets
              storeFieldName.includes(`{${actorArg},${affiliateArg}}`) || // all bets with affiliate
              (storeFieldName.includes(actorArg) && storeFieldName.includes('"status":"Accepted"')) // BetType.Accepted
            )

            if (!isValidStorage) {
              return bets
            }

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
              status: GraphBetStatus.Accepted,
              amount,
              odds: finalOdds,
              settledOdds: null,
              createdAt: String(Math.floor(Date.now() / 1000)),
              payout: null,
              cashout: null,
              potentialPayout: potentialPayout,
              freebet: bet.freebetContractAddress ? {
                freebetId: String(freebetId),
                contractAddress: bet.freebetContractAddress,
              } : null,
              result: null,
              txHash: receipt.transactionHash,
              affiliate,
              selections: selectionFragments as PrematchBetFragment['selections'],
              isRedeemed: false,
              isRedeemable: false,
              isCashedOut: false,
            }

            const newBet = prematchClient!.cache.writeFragment<PrematchBetFragment>({
              fragment: PrematchBetFragmentDoc,
              fragmentName: 'PrematchBet',
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
