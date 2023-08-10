import { useContractRead } from 'wagmi'
import { parseUnits } from 'viem'
import { useChain } from '../contexts/chain'


type CalcOddsProps = {
  amount: string | number | undefined
  conditionId: string | bigint
  outcomeId: string | number
}

export const useCalcOdds = (props: CalcOddsProps) => {
  const { amount, conditionId, outcomeId } = props

  const { appChain, contracts, betToken } = useChain()
  let rawAmount = BigInt(1)

  if (amount !== undefined) {
    rawAmount = parseUnits(`${+amount}`, betToken!.decimals)
  }

  return useContractRead({
    chainId: appChain.id,
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    functionName: 'calcOdds',
    args: [
      BigInt(conditionId),
      rawAmount,
      BigInt(outcomeId),
    ],
  })
}
