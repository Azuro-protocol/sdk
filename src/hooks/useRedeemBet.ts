import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { Address } from 'viem';
import { useChain } from '../contexts/chain'
import { useBetsCache } from './useBetsCache';
import { Bet } from './useBets';


type SubmitProps = {
  bets: Array<Pick<Bet, 'tokenId' | 'coreAddress'>>
}

export const useRedeemBet = () => {
  const publicClient = usePublicClient()
  const { contracts } = useChain()
  const { updateBetCache } = useBetsCache()

  const redeemTx = useWriteContract()

  const batchRedeemTx = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: redeemTx.data,
  })
  const batchReceipt = useWaitForTransactionReceipt({
    hash: batchRedeemTx.data
  })

  const submit = async (props: SubmitProps) => {
    const { bets } = props
    const isBatch = bets.length > 1

    let hash: Address

    if (isBatch) {
      const betsData = bets.map(({tokenId, coreAddress}) => ({
        core: coreAddress as Address,
        tokenId: BigInt(tokenId),
        isNative: false,
      }))

      hash = await batchRedeemTx.writeContractAsync({
        address: contracts.proxyFront.address,
        abi: contracts.proxyFront.abi,
        functionName: 'withdrawPayouts',
        args: [ betsData ],
      })
    } else {
      const { tokenId, coreAddress } = bets[0]!

      hash = await redeemTx.writeContractAsync({
        address: contracts.lp.address,
        abi: contracts.lp.abi,
        functionName: 'withdrawPayout',
        args: [
          coreAddress,
          BigInt(tokenId),
        ],
      })
    }

    const receipt = await publicClient!.waitForTransactionReceipt({
      hash
    })

    bets.forEach(({tokenId, coreAddress}) => {
      updateBetCache({
        coreAddress,
        tokenId,
      }, {
        isRedeemed: true,
        isRedeemable: false,
      })
    })

    return receipt
  }

  return {
    isPending: redeemTx.isPending || batchRedeemTx.isPending,
    isProcessing: receipt.isLoading || batchReceipt.isLoading,
    data: redeemTx.data || batchReceipt.data,
    error: redeemTx.error || batchReceipt.error,
    submit,
  }
}
