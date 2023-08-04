import { usePublicClient, useContractWrite, useWaitForTransaction } from 'wagmi'
import { parseUnits, encodeAbiParameters, parseAbiParameters } from 'viem'
import { useContracts } from './useContracts'
import { useBetToken } from './useBetToken'
import { DEFAULT_DEADLINE, ODDS_DECIMALS } from '../config'


type SubmitProps = {
  amount: number
  minOdds: number
  deadline?: number
  affiliate: `0x${string}`
  selections: {
    conditionId: string | bigint
    outcomeId: string | number
  }[]
}

export const usePlaceBet = () => {
  const publicClient = usePublicClient()
  const contracts = useContracts()
  const betToken = useBetToken()

  const tx = useContractWrite({
    address: contracts?.lp.address,
    abi: contracts?.lp.abi,
    functionName: 'bet',
  })

  const receipt = useWaitForTransaction(tx.data)

  const placeBet = async (props: SubmitProps) => {
    const fixedAmount = +parseFloat(String(props.amount)).toFixed(betToken!.decimals)
    const rawAmount = parseUnits(`${fixedAmount}`, betToken!.decimals)

    const fixedMinOdds = +parseFloat(String(props.minOdds)).toFixed(ODDS_DECIMALS)
    const rawMinOdds = parseUnits(`${fixedMinOdds}`, ODDS_DECIMALS)

    const deadline = BigInt(Math.floor(Date.now() / 1000) + (props.deadline || DEFAULT_DEADLINE))
    const affiliate = props.affiliate

    let coreAddress
    let data

    if (props.selections.length > 1) {
      const tuple: [ bigint, bigint ][] = props.selections.map(({ conditionId, outcomeId }) => [
        BigInt(conditionId),
        BigInt(outcomeId),
      ])

      data = encodeAbiParameters(
        parseAbiParameters('(uint256, uint64)[], uint64'),
        [
          tuple,
          rawMinOdds,
        ]
      )

      coreAddress = contracts!.prematchComboCore.address
    }
    else {
      const { conditionId, outcomeId } = props.selections[0]!

      data = encodeAbiParameters(
        parseAbiParameters('uint256, uint64, uint64'),
        [
          BigInt(conditionId),
          BigInt(outcomeId),
          rawMinOdds,
        ]
      )

      coreAddress = contracts!.prematchCore.address
    }

    const txResult = await tx.writeAsync({
      args: [
        coreAddress,
        rawAmount,
        deadline,
        {
          affiliate,
          data,
        },
      ],
    })

    return publicClient.waitForTransactionReceipt(txResult)
  }

  return {
    isDisabled: !contracts,
    isWaitingApproval: tx.isLoading,
    isPending: receipt.isLoading,
    data: tx.data,
    error: tx.error,
    placeBet,
  }
}
