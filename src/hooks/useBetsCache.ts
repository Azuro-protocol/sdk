import { type TransactionReceipt, type Address, formatUnits, parseUnits } from 'viem'
import {
  type BetsQuery,
  BetStatus,
  ConditionDocument,
  type ConditionQuery,
  type ConditionQueryVariables,
  type ConditionsQuery,
  GameDocument,
  type GameQuery,
  type GameQueryVariables,
  GraphBetStatus,
  ODDS_DECIMALS,
  type Selection,
  coreAbi,
  // ODDS_DECIMALS,
  // liveHostAddress,
  // liveCoreAbi,
  // ConditionStatus,
  // GraphBetStatus,

  // type PrematchBetFragment,
  // PrematchBetFragmentDoc,

  // type LiveBetFragment,
  // LiveBetFragmentDoc,

  // type MainGameInfoFragment,
  // MainGameInfoFragmentDoc,

  // type BettorFragment,
  // BettorFragmentDoc,

  // type PrematchConditionFragment,
  // PrematchConditionFragmentDoc,

  // type LiveConditionFragment,
  // LiveConditionFragmentDoc,

  // type LiveConditionQuery,
  // LiveConditionDocument,

  // type PrematchConditionQuery,
  // PrematchConditionDocument,

  // type GameQuery,
  // GameDocument,
} from '@azuro-org/toolkit'
import { useQueryClient } from '@tanstack/react-query'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'

import { getEventArgsFromTxReceipt } from '../helpers/getEventArgsFromTxReceipt'
import { useChain } from '../contexts/chain'
import { useExtendedAccount } from '../hooks/useAaConnector'
import { gqlRequest } from '../helpers/gqlRequest'
import { type BetsSummary, type Bet, type BetOutcome, BetType } from '../global'


type UpdateBetProps = {
  coreAddress: Address
  tokenId: string | bigint
}

export type NewBetProps = {
  bet: {
    rawAmount: bigint
    selections: Selection[]
    freebetId?: string
    freebetContractAddress?: Address
  }
  odds: Record<string, number>
  affiliate: Address
  receipt: TransactionReceipt
}

export const useBetsCache = () => {
  const queryClient = useQueryClient()
  // const { prematchClient, liveClient } = useApolloClients()
  const { contracts, betToken, graphql } = useChain()
  const { address } = useExtendedAccount()

  const updateBetCache = (
    { coreAddress, tokenId }: UpdateBetProps,
    values: Partial<Bet>
  ) => {
    let bet: Bet | undefined

    queryClient.setQueriesData({
      predicate: ({ queryKey }) => (
        queryKey[0] === 'bets' &&
        queryKey[1] === graphql.bets &&
        String(queryKey[2]).toLowerCase() === address!.toLowerCase()
      ),
    }, (data: { pages: Bet[][], pageParams: number[] }) => {
      if (!data) {
        return data
      }

      const { pages, pageParams } = data

      const newPages = pages.map(page => {
        return page.map(bet => {
          if (bet.tokenId === tokenId) {
            bet = {
              ...bet,
              ...values,
            }

            return bet
          }

          return bet
        })
      })

      return {
        pages: newPages,
        pageParams,
      }
    })

    if (!bet) {
      return
    }

    if (values.isCashedOut) {
      queryClient.setQueriesData({
        predicate: ({ queryKey }) => (
          queryKey[0] === 'bets' &&
          queryKey[1] === graphql.bets &&
          String(queryKey[2]).toLowerCase() === address!.toLowerCase() &&
          queryKey[3] === BetType.CashedOut
        ),
      }, (data: { pages: Bet[][], pageParams: number[] }) => {
        if (!data) {
          return data
        }

        const { pages, pageParams } = data

        const newPage = [
          bet,
          ...pages[0]!,
        ]

        return {
          pages: [ newPage, ...pages.slice(1) ],
          pageParams,
        }
      })
    }

    if (!values.isCashedOut && !bet.payout) {
      return
    }

    queryClient.setQueriesData({
      predicate: ({ queryKey }) => (
        queryKey[0] === 'bets-summary' &&
        queryKey[1] === graphql.bets &&
        String(queryKey[2]).toLowerCase() === address!.toLowerCase()
      ),
    }, (oldData: BetsSummary) => {
      if (!oldData) {
        return oldData
      }

      const newData = {
        ...oldData,
      }

      if (bet.payout) {
        newData.toPayout = String(+newData.toPayout - bet.payout)
      }

      if (values.isCashedOut) {
        newData.betsCount -= 1
        newData.inBets = String(+newData.inBets - +bet.amount)
      }

      return newData
    })

    // const isLive = contracts.liveCore ? coreAddress.toLowerCase() === contracts.liveCore.address.toLowerCase() : false
    // const { cache } = prematchClient!

    // const betEntityId = `${coreAddress.toLowerCase()}_${tokenId}`
    // let bet: LiveBetFragment | PrematchBetFragment | null

    // if (isLive) {
    //   bet = cache.updateFragment<LiveBetFragment>({
    //     id: cache.identify({ __typename: 'LiveBet', id: betEntityId }),
    //     fragment: LiveBetFragmentDoc,
    //     fragmentName: 'LiveBet',
    //   }, (data) => ({
    //     ...data as LiveBetFragment,
    //     ...values as LiveBetFragment,
    //   }))

    //   if (values.isCashedOut) {
    //     prematchClient!.cache.modify({
    //       id: prematchClient!.cache.identify({ __typename: 'Query' }),
    //       fields: {
    //         liveBets: (bets, { storeFieldName, toReference }) => {
    //           const isValidStorage = (
    //             values.isCashedOut && storeFieldName.includes('"isCashedOut":true') // BetType.CashedOut
    //           )

    //           if (!isValidStorage) {
    //             return bets
    //           }

    //           return [ toReference(bet!), ...bets ]
    //         },
    //       },
    //     })
    //   }
    // }
    // else {
    //   bet = cache.updateFragment<PrematchBetFragment>({
    //     id: cache.identify({ __typename: 'Bet', id: betEntityId }),
    //     fragment: PrematchBetFragmentDoc,
    //     fragmentName: 'PrematchBet',
    //   }, (data) => ({
    //     ...data as PrematchBetFragment,
    //     ...values as PrematchBetFragment,
    //   }))

    //   if (values.isCashedOut) {
    //     prematchClient!.cache.modify({
    //       id: prematchClient!.cache.identify({ __typename: 'Query' }),
    //       fields: {
    //         bets: (bets, { storeFieldName, toReference }) => {
    //           const isValidStorage = (
    //             values.isCashedOut && storeFieldName.includes('"isCashedOut":true') // BetType.CashedOut
    //           )

    //           if (!isValidStorage) {
    //             return bets
    //           }

    //           return [ toReference(bet!), ...bets ]
    //         },
    //       },
    //     })
    //   }
    // }

    // if (!bet || !bet.payout) {
    //   return
    // }

    // const bettorEntity = `${contracts.lp.address.toLowerCase()}_${address!.toLowerCase()}_${bet.affiliate!.toLowerCase()}`

    // prematchClient.cache.updateFragment<BettorFragment>({
    //   id: prematchClient.cache.identify({ __typename: 'Bettor', id: bettorEntity }),
    //   fragment: BettorFragmentDoc,
    //   fragmentName: 'Bettor',
    // }, (data) => {
    //   if (!data) {
    //     return data
    //   }

    //   const rawPayout = parseUnits(bet!.payout!, betToken.decimals)
    //   const newRawToPayout = BigInt(data.rawToPayout) - rawPayout

    //   return {
    //     ...data,
    //     rawToPayout: String(newRawToPayout),
    //   }
    // })
  }

  const addBet = async (props: NewBetProps) => {
    const { bet, odds, affiliate, receipt } = props
    const { rawAmount, selections, freebetId } = bet

    const outcomes: BetOutcome[] = []

    const conditions = queryClient.getQueryData<ConditionsQuery['conditions']>([ 'conditions', graphql.feed ])

    for (let index = 0; index < selections.length; index++) {
      const { outcomeId, conditionId } = selections[index]!

      let condition = conditions?.find((condition) => condition.conditionId === conditionId)

      if (!condition) {
        const { condition: _condition } = await gqlRequest<ConditionQuery, ConditionQueryVariables>({
          url: graphql.feed,
          document: ConditionDocument,
          variables: {
            id: conditionId,
          },
        })

        condition = _condition!
      }

      const gameId = condition.game.gameId

      let game = queryClient.getQueryData<GameQuery['game']>([ 'game', graphql.feed, gameId ])

      if (!game) {
        const { game: _game } = await gqlRequest<GameQuery, GameQueryVariables>({
          url: graphql.feed,
          document: GameDocument,
          variables: {
            id: gameId,
          },
        })

        game = _game!
      }

      const { title: customMarketName } = condition
      const { title: customSelectionName } = condition.outcomes.find(outcome => outcome.outcomeId === outcomeId)!
      const selectionName = customSelectionName && customSelectionName !== 'null' ? customSelectionName : getSelectionName({ outcomeId, withPoint: true })
      const marketName = customMarketName && customMarketName !== 'null' ? customMarketName : getMarketName({ outcomeId })

      outcomes.push({
        selectionName,
        outcomeId,
        conditionId,
        // coreAddress: '',
        odds: +(odds[`${conditionId}-${outcomeId}`] || 1),
        marketName,
        game,
        isWin: false,
        isLose: false,
        isCanceled: false,
      })
    }


    const receiptArgs = getEventArgsFromTxReceipt({ receipt, eventName: 'NewLiveBet', abi: coreAbi })

    const tokenId = (receiptArgs?.tokenId!).toString()
    const rawOdds = receiptArgs!.betDatas!.reduce((acc, { odds }) => {
      acc *= odds

      return acc
    }, 1n)

    const rawPotentialPayout = rawAmount * rawOdds

    const potentialPayout = formatUnits(rawPotentialPayout, betToken.decimals + ODDS_DECIMALS)
    const finalOdds = formatUnits(rawOdds, ODDS_DECIMALS)
    const amount = formatUnits(rawAmount, betToken.decimals)
    const isFreebet = Boolean(bet.freebetId)

    queryClient.setQueriesData({
      predicate: ({ queryKey }) => (
        queryKey[0] === 'bets' &&
        queryKey[1] === graphql.bets &&
        String(queryKey[2]).toLowerCase() === address!.toLowerCase() &&
        (queryKey[3] === BetType.Accepted || typeof queryKey[3] === 'undefined')
      ),
    }, (data: { pages: { bets: Bet[], nextPage: number | undefined }[], pageParams: number[] }) => {
      if (!data) {
        return data
      }

      const { pages, pageParams } = data

      const newBet: Bet = {
        affiliate: affiliate!,
        tokenId,
        freebetContractAddress: bet.freebetContractAddress as Address,
        freebetId: bet.freebetId,
        txHash: receipt.transactionHash,
        totalOdds: +finalOdds,
        status: GraphBetStatus.Accepted,
        amount,
        possibleWin: +potentialPayout - (isFreebet ? +amount : 0),
        payout: null,
        createdAt: Math.floor(Date.now() / 1000),
        cashout: undefined,
        isWin: false,
        isLose: false,
        isRedeemable: false,
        isRedeemed: false,
        isCanceled: false,
        isCashedOut: false,
        coreAddress: contracts.core.address,
        lpAddress: contracts.lp.address,
        outcomes,
      }

      const newPage = {
        bets: [ newBet, ...pages[0]!.bets ],
        nextPage: pages[0]!.nextPage,
      }

      return {
        pages: [ newPage, ...pages.slice(1) ],
        pageParams,
      }
    })

    queryClient.setQueriesData({
      predicate: ({ queryKey }) => (
        queryKey[0] === 'bets-summary' &&
        queryKey[1] === graphql.bets &&
        String(queryKey[2]).toLowerCase() === address!.toLowerCase()
      ),
    }, (oldData: BetsSummary) => {
      if (!oldData) {
        return oldData
      }

      return {
        ...oldData,
        betsCount: oldData.betsCount + 1,
        inBets: +oldData.inBets + +amount,
      }
    })
  }

  // const addBet = async (props: NewBetProps) => {
  //   // const { bet, odds, affiliate, receipt } = props
  //   // const { rawAmount, selections, freebetId } = bet

  //   // const coreAddress = selections[0]!.coreAddress
  //   // const isLive = coreAddress.toLowerCase() === liveHostAddress.toLowerCase()
  //   // const client = isLive ? liveClient : prematchClient
  //   // const { cache } = client!

  //   // const selectionFragments: Array<PrematchBetFragment['selections'][0] | LiveBetFragment['selections'][0]> = []

  //   // for (let index = 0; index < selections.length; index++) {
  //   //   const { outcomeId, conditionId: _conditionId } = selections[index]!
  //   //   const conditionId = String(_conditionId)

  //   //   if (isLive) {
  //   //     let condition = cache.readFragment<LiveConditionFragment>({
  //   //       id: cache.identify({ __typename: 'Condition', id: conditionId }),
  //   //       fragment: LiveConditionFragmentDoc,
  //   //       fragmentName: 'LiveCondition',
  //   //     })

  //   //     if (!condition) {
  //   //       const { data: { condition: _condition } } = await client!.query<LiveConditionQuery>({
  //   //         query: LiveConditionDocument,
  //   //         variables: {
  //   //           conditionId,
  //   //         },
  //   //         fetchPolicy: 'network-only',
  //   //       })
  //   //       condition = _condition!
  //   //     }

  //   //     const gameId = condition!.game.gameId

  //   //     const selectionFragment: LiveBetFragment['selections'][0] = {
  //   //       __typename: 'LiveSelection',
  //   //       odds: String(odds[`${conditionId}-${outcomeId}`]),
  //   //       result: null,
  //   //       outcome: {
  //   //         __typename: 'LiveOutcome',
  //   //         outcomeId: String(outcomeId),
  //   //         condition: {
  //   //           __typename: 'LiveCondition',
  //   //           conditionId,
  //   //           status: ConditionStatus.Created,
  //   //           gameId,
  //   //         },
  //   //       },
  //   //     } as const

  //   //     selectionFragments.push(selectionFragment)
  //   //   }
  //   //   else {
  //   //     const conditionEntityId = `${coreAddress.toLowerCase()}_${conditionId}`
  //   //     let condition = cache.readFragment<PrematchConditionFragment>({
  //   //       id: cache.identify({ __typename: 'Condition', id: conditionEntityId }),
  //   //       fragment: PrematchConditionFragmentDoc,
  //   //       fragmentName: 'PrematchCondition',
  //   //     })

  //   //     if (!condition) {
  //   //       const { data: { condition: _condition } } = await client!.query<PrematchConditionQuery>({
  //   //         query: PrematchConditionDocument,
  //   //         variables: {
  //   //           id: conditionEntityId,
  //   //         },
  //   //         fetchPolicy: 'network-only',
  //   //       })
  //   //       condition = _condition!
  //   //     }

  //   //     const outcome = condition.outcomes.find((outcome) => outcome.outcomeId === outcomeId)!
  //   //     const gameId = condition?.game.gameId

  //   //     const gameEntityId = `${contracts.lp.address.toLowerCase()}_${gameId}`

  //   //     let game = cache.readFragment<MainGameInfoFragment>({
  //   //       id: cache.identify({ __typename: 'Game', id: gameEntityId }),
  //   //       fragment: MainGameInfoFragmentDoc,
  //   //       fragmentName: 'MainGameInfo',
  //   //     })

  //   //     if (!game) {
  //   //       const { data: { games } } = await client!.query<GameQuery>({
  //   //         query: GameDocument,
  //   //         variables: {
  //   //           gameId,
  //   //         },
  //   //         fetchPolicy: 'network-only',
  //   //       })

  //   //       game = games[0]!
  //   //     }

  //   //     const selectionFragment: PrematchBetFragment['selections'][0] = {
  //   //       __typename: 'Selection',
  //   //       odds: String(odds[`${conditionId}-${outcomeId}`]),
  //   //       result: null,
  //   //       outcome: {
  //   //         __typename: 'Outcome',
  //   //         outcomeId: String(outcomeId),
  //   //         title: outcome.title,
  //   //         condition: {
  //   //           __typename: 'Condition',
  //   //           conditionId,
  //   //           status: ConditionStatus.Created,
  //   //           title: condition.title,
  //   //           game,
  //   //         },
  //   //       },
  //   //     } as const

  //   //     selectionFragments.push(selectionFragment)
  //   //   }
  //   // }

  //   // let tokenId: string
  //   // let rawOdds: bigint = 0n

  //   // if (isLive) {
  //   //   const receiptArgs = getEventArgsFromTxReceipt({ receipt, eventName: 'NewLiveBet', abi: liveCoreAbi })

  //   //   tokenId = (receiptArgs?.tokenId!).toString()
  //   //   rawOdds = receiptArgs?.odds!
  //   // }
  //   // // we don't need additional for freeBet cause it triggers NewBet event on prematch core
  //   // else {
  //   //   const isExpress = selections.length > 1

  //   //   if (isExpress) {

  //   //     const receiptArgs = getEventArgsFromTxReceipt({
  //   //       receipt,
  //   //       eventName: 'NewBet',
  //   //       abi: contracts.prematchComboCore.abi,
  //   //     })

  //   //     tokenId = receiptArgs?.betId.toString()!
  //   //     rawOdds = receiptArgs?.bet.odds!
  //   //   }
  //   //   else {
  //   //     const { conditionId, outcomeId } = selections[0]!
  //   //     const eventParams = {
  //   //       conditionId: BigInt(conditionId),
  //   //       outcomeId: BigInt(outcomeId),
  //   //     }

  //   //     const receiptArgs = getEventArgsFromTxReceipt({
  //   //       receipt,
  //   //       eventName: 'NewBet',
  //   //       abi: contracts.prematchCore.abi,
  //   //       params: eventParams,
  //   //     })

  //   //     tokenId = receiptArgs?.tokenId.toString()!
  //   //     rawOdds = receiptArgs?.odds!
  //   //   }
  //   // }

  //   // const rawPotentialPayout = rawAmount * rawOdds

  //   // const potentialPayout = formatUnits(rawPotentialPayout, betToken.decimals)
  //   // const finalOdds = formatUnits(rawOdds, ODDS_DECIMALS)
  //   // const amount = formatUnits(rawAmount, betToken.decimals)

  //   // const actorArg = `"actor":"${address!.toLowerCase()}"`
  //   // const affiliateArg = `"affiliate":"${affiliate}"`

  //   // if (isLive) {
  //   //   prematchClient!.cache.modify({
  //   //     id: prematchClient!.cache.identify({ __typename: 'Query' }),
  //   //     fields: {
  //   //       liveBets: (bets, { storeFieldName }) => {
  //   //         const isValidStorage = (
  //   //           storeFieldName.includes(`{${actorArg}}`) || // all bets
  //   //           storeFieldName.includes(`{${actorArg},${affiliateArg}}`) || // all bets with affiliate
  //   //           (storeFieldName.includes(actorArg) && storeFieldName.includes('"status":"Accepted"')) // BetType.Accepted
  //   //         )

  //   //         if (!isValidStorage) {
  //   //           return bets
  //   //         }

  //   //         const betEntityId = `${coreAddress.toLowerCase()}_${tokenId}`

  //   //         const data: LiveBetFragment = {
  //   //           __typename: 'LiveBet',
  //   //           id: betEntityId,
  //   //           tokenId: tokenId,
  //   //           core: {
  //   //             address: coreAddress,
  //   //             liquidityPool: {
  //   //               address: contracts.lp.address,
  //   //             },
  //   //           },
  //   //           status: GraphBetStatus.Accepted,
  //   //           amount,
  //   //           odds: finalOdds,
  //   //           settledOdds: null,
  //   //           createdAt: String(Math.floor(Date.now() / 1000)),
  //   //           payout: null,
  //   //           potentialPayout: potentialPayout,
  //   //           result: null,
  //   //           cashout: null,
  //   //           txHash: receipt.transactionHash,
  //   //           affiliate,
  //   //           selections: selectionFragments as LiveBetFragment['selections'],
  //   //           isRedeemed: false,
  //   //           isRedeemable: false,
  //   //           isCashedOut: false,
  //   //         }

  //   //         const newBet = prematchClient!.cache.writeFragment<LiveBetFragment>({
  //   //           fragment: LiveBetFragmentDoc,
  //   //           fragmentName: 'LiveBet',
  //   //           data,
  //   //         })

  //   //         return [ newBet, ...bets ]
  //   //       },
  //   //     },
  //   //   })
  //   // }
  //   // else {
  //   //   prematchClient!.cache.modify({
  //   //     id: prematchClient!.cache.identify({ __typename: 'Query' }),
  //   //     fields: {
  //   //       bets: (bets, { storeFieldName }) => {
  //   //         const isValidStorage = (
  //   //           storeFieldName.includes(`{${actorArg}}`) || // all bets
  //   //           storeFieldName.includes(`{${actorArg},${affiliateArg}}`) || // all bets with affiliate
  //   //           (storeFieldName.includes(actorArg) && storeFieldName.includes('"status":"Accepted"')) // BetType.Accepted
  //   //         )

  //   //         if (!isValidStorage) {
  //   //           return bets
  //   //         }

  //   //         const betEntityId = `${coreAddress.toLowerCase()}_${tokenId}`

  //   //         const data: PrematchBetFragment = {
  //   //           __typename: 'Bet',
  //   //           id: betEntityId,
  //   //           tokenId: tokenId,
  //   //           core: {
  //   //             address: coreAddress,
  //   //             liquidityPool: {
  //   //               address: contracts.lp.address,
  //   //             },
  //   //           },
  //   //           status: GraphBetStatus.Accepted,
  //   //           amount,
  //   //           odds: finalOdds,
  //   //           settledOdds: null,
  //   //           createdAt: String(Math.floor(Date.now() / 1000)),
  //   //           payout: null,
  //   //           cashout: null,
  //   //           potentialPayout: potentialPayout,
  //   //           freebet: bet.freebetContractAddress ? {
  //   //             freebetId: String(freebetId),
  //   //             contractAddress: bet.freebetContractAddress,
  //   //           } : null,
  //   //           result: null,
  //   //           txHash: receipt.transactionHash,
  //   //           affiliate,
  //   //           selections: selectionFragments as PrematchBetFragment['selections'],
  //   //           isRedeemed: false,
  //   //           isRedeemable: false,
  //   //           isCashedOut: false,
  //   //         }

  //   //         const newBet = prematchClient!.cache.writeFragment<PrematchBetFragment>({
  //   //           fragment: PrematchBetFragmentDoc,
  //   //           fragmentName: 'PrematchBet',
  //   //           data,
  //   //         })

  //   //         return [ newBet, ...bets ]
  //   //       },
  //   //     },
  //   //   })
  //   // }

  //   // const bettorEntity = `${contracts.lp.address.toLowerCase()}_${address!.toLowerCase()}_${affiliate.toLowerCase()}`

  //   // const bettorFragment = cache.readFragment<BettorFragment>({
  //   //   id: cache.identify({ __typename: 'Bettor', id: bettorEntity }),
  //   //   fragment: BettorFragmentDoc,
  //   //   fragmentName: 'Bettor',
  //   // })

  //   // if (bettorFragment) {
  //   //   prematchClient.cache.updateFragment<BettorFragment>({
  //   //     id: prematchClient.cache.identify({ __typename: 'Bettor', id: bettorEntity }),
  //   //     fragment: BettorFragmentDoc,
  //   //     fragmentName: 'Bettor',
  //   //   }, (data) => ({
  //   //     ...data as BettorFragment,
  //   //     betsCount: data!.betsCount + 1,
  //   //     rawInBets: String(BigInt(data!.rawInBets) + rawAmount),
  //   //   }))
  //   // }
  //   // else {
  //   //   prematchClient!.cache.modify({
  //   //     id: prematchClient!.cache.identify({ __typename: 'Query' }),
  //   //     fields: {
  //   //       bettors: (bettors) => {
  //   //         const newBettor = prematchClient!.cache.writeFragment<BettorFragment>({
  //   //           fragment: BettorFragmentDoc,
  //   //           fragmentName: 'Bettor',
  //   //           data: {
  //   //             __typename: 'Bettor',
  //   //             id: bettorEntity,
  //   //             rawToPayout: '0',
  //   //             rawInBets: String(rawAmount),
  //   //             rawTotalPayout: '0',
  //   //             rawTotalProfit: '0',
  //   //             betsCount: 1,
  //   //             wonBetsCount: 0,
  //   //             lostBetsCount: 0,
  //   //           },
  //   //         })

  //   //         return [ ...bettors, newBettor ]
  //   //       },
  //   //     },
  //   //   })
  //   // }
  // }

  return {
    updateBetCache,
    addBet,
  }
}
