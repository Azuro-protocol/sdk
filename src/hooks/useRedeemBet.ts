import { useContractWrite, useWaitForTransaction } from 'wagmi'
import { useChain } from 'chain-context'
import { usePublicClient } from './usePublicClient'


type SubmitProps = {
  tokenId: string
  coreAddress: `0x${string}`
}

export const useRedeemBet = () => {
  const publicClient = usePublicClient()
  const { contracts } = useChain()

  const tx = useContractWrite({
    address: contracts.lp.address,
    abi: contracts.lp.abi,
    functionName: 'withdrawPayout',
  })

  const receipt = useWaitForTransaction(tx.data)

  const submit = async (props: SubmitProps) => {
    const { tokenId, coreAddress } = props

    const txResult = await tx.writeAsync({
      args: [
        coreAddress,
        BigInt(tokenId),
      ],
    })

    return publicClient.waitForTransactionReceipt(txResult)
  }

  return {
    isPending: tx.isLoading,
    isProcessing: receipt.isLoading,
    data: tx.data,
    error: tx.error,
    submit,
  }
}
