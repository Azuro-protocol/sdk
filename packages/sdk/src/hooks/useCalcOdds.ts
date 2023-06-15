import { useContractRead } from 'wagmi'
import { useContracts } from './useContracts'


type CalcOddsProps = {
  rawAmount: bigint | undefined
  conditionId: string | number
  outcomeId: string | number
}

export const useCalcOdds = (props: CalcOddsProps) => {
  const { rawAmount = BigInt(1), conditionId, outcomeId } = props

  const contracts = useContracts()

  return useContractRead({
    address: contracts!.prematchCore.address,
    abi: contracts!.prematchCore.abi,
    functionName: 'calcOdds',
    args: [
      BigInt(conditionId),
      rawAmount,
      BigInt(outcomeId),
    ],
  })
}
