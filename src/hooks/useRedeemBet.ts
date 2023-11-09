import { useContractWrite, useWaitForTransaction, usePublicClient, Address } from 'wagmi'
import { useChain } from '../contexts/chain'
import { useBetsCache } from './useBetsCache';


type SubmitProps = {
  tokenId: string | bigint
  coreAddress: Address
}

export const useRedeemBet = () => {
  const publicClient = usePublicClient()
  const { contracts } = useChain()
  const { updateBetCache } = useBetsCache()

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

    const receipt = await publicClient.waitForTransactionReceipt(tx)

    updateBetCache({
      coreAddress,
      tokenId,
    }, {
      isRedeemed: true,
      isRedeemable: false,
    })

    return receipt
  }

  return {
    isPending: redeemTx.isLoading,
    isProcessing: receipt.isLoading,
    data: redeemTx.data,
    error: redeemTx.error,
    submit,
  }
}
