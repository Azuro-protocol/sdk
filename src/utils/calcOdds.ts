import { createPublicClient, http, parseUnits } from 'viem'
import { chainsData, prematchCoreAbi } from '../config'


type CalcOddsProps = {
  chainId: number
  conditionId: string | bigint
  outcomeId: string | number | bigint
  amount?: string | number
}

export const calcOdds = (props: CalcOddsProps) => {
  const { chainId, conditionId, outcomeId, amount } = props

  const chainData = chainsData[chainId]

  if (!chainData) {
    console.error(`Chain with passed ID not supported. Passed: ${chainId}`)
    return
  }

  const publicClient = createPublicClient({
    chain: chainData.chain,
    transport: http(),
  })

  let rawAmount = BigInt(1)

  if (amount !== undefined) {
    rawAmount = parseUnits(`${parseFloat(String(amount))}`, chainData.betToken.decimals)
  }

  return publicClient.readContract({
    address: chainData.addresses.prematchCore,
    abi: prematchCoreAbi,
    functionName: 'calcOdds',
    args: [
      BigInt(conditionId),
      rawAmount,
      BigInt(outcomeId)
    ],
  })
}
