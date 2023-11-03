import { useContractRead } from 'wagmi'
import { parseUnits } from 'viem'
import { useChain } from '../contexts/chain'
import { Selection } from '../global';


type CalcOddsProps = {
  selections: Selection[]
  amount?: string
}

export const useCalcOdds = (props: CalcOddsProps) => {
  const { amount, selections } = props

  const { appChain, contracts, betToken } = useChain()
  let rawAmount = BigInt(1)

  if (amount !== undefined) {
    rawAmount = parseUnits(amount, betToken!.decimals)
  }

  const isSingle = selections.length === 1

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

  return {
    isLoading: single.isLoading || combo.isLoading,
    data: {
      conditionsOdds: isSingle ? (single.data ? [ single.data ] : undefined) : combo.data?.[0],
      totalOdds: isSingle ? single.data : combo.data?.[1],
    },
    error: single.error || combo.error,
  }
}
