import { createPublicClient, http, parseUnits } from 'viem'
import { chainsData, type ChainId } from 'config'


type CalcOddsProps = {
  chainId: ChainId
  conditionId: string | bigint
  outcomeId: string | number | bigint
  amount?: string | number
}

export const calcOdds = (props: CalcOddsProps) => {
  const { chainId, conditionId, outcomeId, amount } = props

  const { chain, contracts, betToken } = chainsData[chainId]

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  })

  let rawAmount = BigInt(1)

  if (amount !== undefined) {
    rawAmount = parseUnits(`${parseFloat(String(amount))}`, betToken.decimals)
  }

  return publicClient.readContract({
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    functionName: 'calcOdds',
    args: [
      BigInt(conditionId),
      rawAmount,
      BigInt(outcomeId)
    ],
  })
}
