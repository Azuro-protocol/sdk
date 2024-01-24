import { BetFragmentDoc, type BetFragment } from '../docs/prematch/fragments/bet'
import { MainGameInfoFragmentDoc, type MainGameInfoFragment } from '../docs/prematch/fragments/mainGameInfo'
import { ConditionFragmentDoc, type ConditionFragment } from '../docs/prematch/fragments/condition'
import { ConditionStatus, BetStatus } from '../docs/prematch/types';
import { useApolloClients } from '../contexts/apollo';
import { Address } from 'wagmi';
import { TransactionReceipt, formatUnits } from 'viem';
import { getEventArgsFromTxReceipt } from '../helpers';
import { useChain } from '../contexts/chain';
import { ODDS_DECIMALS } from '../config';
import { Selection } from '../global';


type UpdateBetProps = {
  coreAddress: Address
  tokenId: string | bigint
}

type NewBetProps = {
  bet: {
    amount: string
    selections: Selection[]
    selectionsOdds: Record<string, number>
    freebetId?: string | bigint
    freebetContractAddress?: Address
  }
  receipt: TransactionReceipt
}

export const useBetsCache = () => {
  const { prematchClient: client } = useApolloClients()
  const { cache } = client!
  const { contracts } = useChain()

  const updateBetCache = ({ coreAddress, tokenId }: UpdateBetProps, values: Partial<BetFragment>) => {
    const betEntityId = `${coreAddress}_${tokenId}`
  
    cache.updateFragment<BetFragment>({
      id: cache.identify({ __typename: 'Bet', id: betEntityId }),
      fragment: BetFragmentDoc,
      fragmentName: 'Bet',
    }, (data) => ({
      ...data as BetFragment,
      ...values,
    }))
  }

  const addBet = (props: NewBetProps) => {
    const { bet, receipt } = props
    const { amount, selections, selectionsOdds } = bet

    const isExpress = selections.length > 1

    const core = isExpress ? contracts.prematchComboCore : contracts.prematchCore
  
    const selectionFragments: BetFragment['selections'] = []
  
    for (let index = 0; index < selections.length; index++) {
      const { outcomeId, conditionId: _conditionId } = selections[index]!
      const conditionId = String(_conditionId)

      const conditionEntityId = `${core.address.toLowerCase()}_${conditionId}`
      const condition = cache.readFragment<ConditionFragment>({
        id: cache.identify({ __typename: 'Condition', id: conditionEntityId }),
        fragment: ConditionFragmentDoc,
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
  
      const selectionFragment: BetFragment['selections'][number] = {
        __typename: 'Selection',
        odds: String(selectionsOdds[`${conditionId}-${outcomeId}`]),
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

    const receiptArgs = getEventArgsFromTxReceipt({ receipt, eventName: 'NewBet', abi: core.abi })

    const tokenId = (isExpress ? receiptArgs?.betId : receiptArgs?.tokenId)?.toString()
    const rawOdds = isExpress ? receiptArgs?.bet.odds : receiptArgs?.odds

    const finalOdds = formatUnits(rawOdds, ODDS_DECIMALS)

    const potentialPayout = String(+amount * +finalOdds)

    cache.modify({
      id: cache.identify({ __typename: 'Query' }),
      fields: {
        bets: (bets) => {
          // https://github.com/Azuro-protocol/azuro-api-subgraph/blob/main/src/utils/schema.ts
          const betEntityId = `${core.address.toLowerCase()}_${tokenId}`
  
          const data: BetFragment = {
            __typename: 'Bet',
            id: betEntityId,
            tokenId: tokenId,
            core: {
              address: core.address,
              liquidityPool: {
                address: contracts.lp.address,
              },
            },
            status: BetStatus.Accepted,
            amount: bet.amount,
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
            selections: selectionFragments,
          }
  
          const newBet = cache.writeFragment<BetFragment>({
            fragment: BetFragmentDoc,
            fragmentName: 'Bet',
            data,
          })
  
          return [ newBet, ...bets ]
        }
      }
    })
  }

  return {
    updateBetCache,
    addBet,
  }
}
