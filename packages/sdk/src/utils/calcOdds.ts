import { createPublicClient, http, parseUnits } from 'viem'
import { prematchCoreAbi } from '../abis'
import { chainsData } from '../config'


type CalcOddsProps = {
  chainId: number
  conditionId: string | number
  outcomeId: string | number
  amount?: string | number
}

// /**
//  * Returns actual odds value for specific outcomeId (on specific condition and chain)
//  *
//  * @param props
//  * @param {number} props.chainId
//  * @param {string | number} props.conditionId
//  * @param {string | number} props.outcomeId
//  * @param {string | number} [props.amount]
//  * @returns PromiseLike<bigint>
//  */
export const calcOdds = (props: CalcOddsProps) => {
  const chainData = chainsData[props.chainId]

  if (!chainData) {
    console.error(`Chain with passed ID not supported. Passed: ${props.chainId}`)
    return
  }

  const publicClient = createPublicClient({
    chain: chainData.chain,
    transport: http(),
  })

  let rawAmount = BigInt(1)

  if (props.amount !== undefined) {
    rawAmount = parseUnits(`${parseFloat(String(props.amount))}`, chainData.betToken.decimals)
  }

  return publicClient.readContract({
    address: chainData.addresses.prematchCore,
    abi: prematchCoreAbi,
    functionName: 'calcOdds',
    args: [
      BigInt(props.conditionId),
      rawAmount,
      BigInt(props.outcomeId)
    ],
  })
}
