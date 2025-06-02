import { type TransactionReceipt, type Address, formatUnits, parseUnits } from 'viem'
import {
  type ConditionQuery,
  type ConditionQueryVariables,
  type ConditionsQuery,
  type BettorsQuery,
  type GameQuery,
  type GameQueryVariables,
  type Selection,
  type ChainId,

  ConditionDocument,
  GameDocument,
  GraphBetStatus,
  ODDS_DECIMALS,
  coreAbi,
} from '@azuro-org/toolkit'
import { useQueryClient } from '@tanstack/react-query'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'

import { getEventArgsFromTxReceipt } from '../helpers/getEventArgsFromTxReceipt'
import { useOptionalChain } from '../contexts/chain'
import { useExtendedAccount } from '../hooks/useAaConnector'
import { gqlRequest } from '../helpers/gqlRequest'
import { type Bet, type BetOutcome, BetType } from '../global'


export type NewBetProps = {
  bet: {
    rawAmount: bigint
    selections: Selection[]
    freebetId: string | undefined
    isFreebetAmountReturnable: boolean | undefined
  }
  odds: Record<string, number>
  affiliate: Address
  receipt: TransactionReceipt
}

export const useBetsCache = (chainId?: ChainId) => {
  const queryClient = useQueryClient()
  const { address } = useExtendedAccount()

  const { contracts, betToken, graphql } = useOptionalChain(chainId)

  const updateBetCache = (
    tokenId: string | bigint,
    values: Partial<Bet>,
    isLegacy?: boolean
  ) => {
    let cachedBet: Bet | undefined
    const betsKey = isLegacy ? 'legacy-bets' : 'bets'

    queryClient.setQueriesData({
      predicate: ({ queryKey }) => (
        queryKey[0] === betsKey &&
        queryKey[1] === graphql.bets &&
        String(queryKey[2]).toLowerCase() === address!.toLowerCase()
      ),
    }, (data: { pages: { bets: Bet[], nextPage: number | undefined }[], pageParams: number[] }) => {
      if (!data) {
        return data
      }

      const { pages, pageParams } = data

      const newPages = pages.map(page => {
        const { bets, nextPage } = page

        return {
          nextPage,
          bets: bets.map(bet => {
            if (bet.tokenId === tokenId) {
              cachedBet = {
                ...bet,
                ...values,
              }

              return cachedBet
            }

            return bet
          }),
        }
      })

      return {
        pages: newPages,
        pageParams,
      }
    })

    if (!values.isCashedOut && !cachedBet?.payout && !cachedBet?.isCanceled) {
      return
    }

    queryClient.setQueriesData({
      predicate: ({ queryKey }) => (
        queryKey[0] === 'bets-summary' &&
        queryKey[1] === graphql.bets &&
        String(queryKey[2]).toLowerCase() === address!.toLowerCase()
      ),
    }, (oldData: BettorsQuery['bettors']) => {
      if (!oldData) {
        return oldData
      }

      const newData = [ ...oldData ]
      const bettorIndex = newData.findIndex(({ id }) => id.split('_')[0]?.toLowerCase() === contracts.lp.address.toLowerCase())

      if (bettorIndex === -1) {
        return oldData
      }

      const bettor = { ...newData[bettorIndex]! }

      if (cachedBet!.payout || cachedBet!.isCanceled) {
        const rawAmount = cachedBet!.isCanceled ? cachedBet!.amount : cachedBet!.payout
        const rawPayout = parseUnits(String(rawAmount), betToken.decimals)
        const newRawToPayout = BigInt(bettor.rawToPayout) - rawPayout

        bettor.rawToPayout = String(newRawToPayout)
      }

      if (values.isCashedOut) {
        const rawAmount = parseUnits(cachedBet!.amount, betToken.decimals)

        bettor.rawInBets = String(BigInt(bettor.rawInBets) - rawAmount)
        bettor.betsCount -= 1
      }

      newData[bettorIndex] = bettor

      return newData
    })
  }

  const addBet = async (props: NewBetProps) => {
    const { bet, odds, affiliate, receipt } = props
    const { rawAmount, selections, freebetId, isFreebetAmountReturnable } = bet

    const outcomes: BetOutcome[] = []

    const receiptArgs = getEventArgsFromTxReceipt({ receipt, eventName: 'NewLiveBet', abi: coreAbi })

    if (!receiptArgs) {
      return
    }

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

      const eventOutcome = receiptArgs.betDatas.find(({ conditionId: rawConditionId, outcomeId: rawOutcomeId }) => (
        rawConditionId === BigInt(conditionId) && rawOutcomeId === BigInt(outcomeId)
      ))!

      outcomes.push({
        selectionName,
        outcomeId,
        conditionId,
        odds: +(odds[`${conditionId}-${outcomeId}`] || 1),
        marketName,
        wonOutcomeIds: null,
        game,
        isWin: false,
        isLose: false,
        isCanceled: false,
        isLive: eventOutcome.conditionKind === 1,
      })
    }


    const tokenId = (receiptArgs?.tokenId!).toString()
    const rawOdds = receiptArgs!.betDatas!.reduce((acc, { odds }) => {
      acc *= odds

      return acc
    }, 1n)

    const rawPotentialPayout = rawAmount * rawOdds

    const finalOdds = formatUnits(rawOdds, ODDS_DECIMALS * receiptArgs!.betDatas.length)
    const amount = formatUnits(rawAmount, betToken.decimals)

    const isFreebet = Boolean(freebetId)
    const betDiff = isFreebet && isFreebetAmountReturnable ? +amount : 0 // for freebet we must exclude bonus value from possible win

    const potentialPayout = +formatUnits(rawPotentialPayout, ODDS_DECIMALS * receiptArgs!.betDatas.length + betToken.decimals) - betDiff

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
        actor: address!,
        affiliate,
        tokenId,
        freebetId: freebetId || null,
        isFreebetAmountReturnable: isFreebetAmountReturnable ?? null,
        paymaster: contracts.paymaster.address,
        txHash: receipt.transactionHash,
        redeemedTxHash: null,
        totalOdds: +finalOdds,
        status: GraphBetStatus.Accepted,
        amount,
        possibleWin: potentialPayout,
        payout: null,
        createdAt: Math.floor(Date.now() / 1000),
        resolvedAt: null,
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
    }, (oldData: BettorsQuery['bettors']) => {
      if (!oldData) {
        return oldData
      }

      const newData = [ ...oldData ]
      const bettorIndex = oldData.findIndex(({ id }) => id.split('_')[0]?.toLowerCase() === contracts.lp.address.toLowerCase())

      if (bettorIndex === -1) {
        return oldData
      }

      const bettor = { ...newData[bettorIndex]! }
      bettor.betsCount += 1
      bettor.rawInBets = String(BigInt(bettor.rawInBets) + rawAmount)

      newData[bettorIndex] = bettor

      return newData
    })
  }

  return {
    updateBetCache,
    addBet,
  }
}
