import { useContractWrite, useWaitForTransaction, usePublicClient, Address } from 'wagmi'
import { useChain } from '../contexts/chain'


type SubmitProps = {
  tokenId: string | bigint
  coreAddress: Address
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

    return publicClient.waitForTransactionReceipt(tx)
  }

  return {
    isPending: redeemTx.isLoading,
    isProcessing: receipt.isLoading,
    data: redeemTx.data,
    error: redeemTx.error,
    submit,
  }
}
