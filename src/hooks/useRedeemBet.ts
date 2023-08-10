import { useContractWrite, useWaitForTransaction } from 'wagmi'
import { useChain } from '../contexts/chain'
import { usePublicClient } from './usePublicClient'


type SubmitProps = {
  tokenId: string
  coreAddress: `0x${string}`
}

export const useRedeemBet = () => {
  const publicClient = usePublicClient()
  const { contracts } = useChain()

  const redeemTx = useContractWrite({
    address: contracts.lp.address,
    abi: contracts.lp.abi,
    functionName: 'withdrawPayout',
  })

  const receipt = useWaitForTransaction(redeemTx.data)

  const submit = async (props: SubmitProps) => {
    const { tokenId, coreAddress } = props

    const tx = await redeemTx.writeAsync({
      args: [
        coreAddress,
        BigInt(tokenId),
      ],
    })

    return publicClient.waitForTransactionReceipt({
      hash: tx.hash,
      confirmations: 12,
    })
  }

  return {
    isPending: redeemTx.isLoading,
    isProcessing: receipt.isLoading,
    data: redeemTx.data,
    error: redeemTx.error,
    submit,
  }
}
