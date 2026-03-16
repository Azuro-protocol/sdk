import gql from 'graphql-tag';
import type { GraphBetStatus, BetResult, SelectionResult, SelectionKind, BetConditionStatus } from '@azuro-org/toolkit';
import { Exact, V3_Bet_Filter } from './types';
export type BetsQueryVariables = Exact<{
  first?: number;
  skip?: number;
  where: V3_Bet_Filter;
}>;

export type BetsQuery = {
  __typename?: 'Query',
  v3Bets: Array<{
    __typename?: 'V3_Bet',
    id: string,
    actor: string,
    amount: string,
    status: GraphBetStatus,
    potentialPayout: string,
    payout: string | null,
    result: BetResult | null,
    odds: string,
    settledOdds: string | null,
    redeemedTxHash: string | null,
    affiliate: string,
    nonce: string,
    isRedeemed: boolean,
    isRedeemable: boolean,
    isCashedOut: boolean,
    freebetId?: string | null,
    isFreebetAmountReturnable?: boolean | null,
    paymasterContractAddress?: string | null,
    tokenId: string,
    createdAt: string,
    resolvedAt?: string | null,
    redeemedAt?: string | null,
    txHash: string,
    core: {
      address: string,
      liquidityPool: {
        address: string
      }
    },
    selections: Array<{
      __typename?: 'V3_Selection',
      odds: string,
      result?: SelectionResult | null,
      conditionKind: SelectionKind,
      outcome: {
        __typename?: 'V3_Outcome',
        outcomeId: string,
        title?: string | null,
        condition: {
          __typename?: 'V3_Condition',
          conditionId: string,
          title?: string | null,
          status: BetConditionStatus,
          gameId: string
          wonOutcomeIds?: Array<string> | null
        }
      }
    }>,
    cashout?: {
      __typename?: 'Cashout',
      payout: string
    } | null
  }>
};

export const BetsDocument = gql`
    query Bets($first: Int, $skip: Int, $where: V3_Bet_filter!) {
  v3Bets(
    first: $first
    skip: $skip
    where: $where
    orderBy: createdBlockNumber
    orderDirection: desc
    subgraphError: allow
  ) {
    id
    tokenId: betId
    actor
    amount
    status
    potentialPayout
    payout
    result
    odds
    nonce
    settledOdds
    createdAt: createdBlockTimestamp
    resolvedAt: resolvedBlockTimestamp
    redeemedAt: redeemedBlockTimestamp
    txHash: createdTxHash
    redeemedTxHash
    affiliate
    isRedeemed
    isRedeemable
    isCashedOut
    core {
      address
      liquidityPool {
        address
      }
    }
    selections {
      odds
      result
      conditionKind
      outcome {
        outcomeId
        title
        condition {
          conditionId
          title
          status
          gameId
          wonOutcomeIds
        }
      }
    }
    freebetId
    isFreebetAmountReturnable
    paymasterContractAddress
    cashout {
      payout
    }
  }
}
    `;
