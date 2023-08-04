import { usePublicClient, useContractWrite, useWaitForTransaction } from 'wagmi'
import { useContracts } from './useContracts'
import { useBetToken } from './useBetToken'


type SubmitProps = {
  tokenId: string
  coreAddress: `0x${string}`
}

export const useRedeemBet = () => {
  const publicClient = usePublicClient()
  const contracts = useContracts()
  const betToken = useBetToken()

  const tx = useContractWrite({
    address: contracts?.lp.address,
    abi: contracts?.lp.abi,
    functionName: 'withdrawPayout',
  })

  const receipt = useWaitForTransaction(tx.data)

  const redeem = async (props: SubmitProps) => {
    const { tokenId, coreAddress } = props

    const txResult = await tx.writeAsync({
      args: [
        coreAddress,
        BigInt(tokenId),
        betToken!.isNative,
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
    redeem,
  }
}
