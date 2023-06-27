import { useContractRead } from 'wagmi'
import { parseUnits } from 'viem'
import { useBetToken } from './useBetToken'
import { useContracts } from './useContracts'


type CalcOddsProps = {
  amount: string | number | undefined
  conditionId: string | number
  outcomeId: string | number
}

export const useCalcOdds = (props: CalcOddsProps) => {
  const { amount, conditionId, outcomeId } = props

  const contracts = useContracts()
  const betToken = useBetToken()
  const rawAmount = amount ? parseUnits(`${+amount}`, betToken!.decimals) : BigInt(1)

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
