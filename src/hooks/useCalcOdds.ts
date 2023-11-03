import { useContractRead, usePublicClient } from 'wagmi'
import { parseUnits } from 'viem'
import { useChain } from '../contexts/chain'
import { oddsWatcher } from '../modules/oddsWatcher';
import { Selection } from '../global';
import { useEffect } from 'react';


type CalcOddsProps = {
  selections: Selection[]
  amount?: string
}

export const useCalcOdds = (props: CalcOddsProps) => {
  const { amount, selections } = props

  const publicClient = usePublicClient()
  const { appChain, contracts, betToken } = useChain()

  let rawAmount = BigInt(1)
  const isSingle = selections.length === 1

  if (amount !== undefined) {
    rawAmount = parseUnits(amount, betToken!.decimals)
  }

  const rawSelections = selections.map(({ conditionId, outcomeId }) => ({
    conditionId: BigInt(conditionId),
    outcomeId: BigInt(outcomeId),
  }))

  const single = useContractRead({
    chainId: appChain.id,
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    functionName: 'calcOdds',
    args: [
      rawSelections[0]!.conditionId,
      rawAmount,
      rawSelections[0]!.outcomeId,
    ],
    enabled: Boolean(rawSelections.length === 1),
  })

  const combo = useContractRead({
    chainId: appChain.id,
    address: contracts.prematchComboCore.address,
    abi: contracts.prematchComboCore.abi,
    functionName: 'calcOdds',
    args: [
      rawSelections,
      rawAmount,
    ],
    enabled: Boolean(rawSelections.length > 1),
  })

  useEffect(() => {
    if (!selections.length) {
      return
    }

    const unsubscribeList = selections.map(({ conditionId, outcomeId }) => {
      const unsubscribe = oddsWatcher.subscribe(`${conditionId}`, `${outcomeId}`, () => {
        if (isSingle) {
          single.refetch()
        } else {
          combo.refetch()
        }
      })
  
      return unsubscribe
    })

    return () => {
      unsubscribeList.forEach((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [ selections, publicClient ])

  return {
    data: {
      conditionsOdds: isSingle ? (single.data ? [ single.data ] : undefined) : combo.data?.[0],
      totalOdds: isSingle ? single.data : combo.data?.[1],
    },
    loading: single.isLoading || combo.isLoading,
    error: single.error || combo.error,
  }
}
