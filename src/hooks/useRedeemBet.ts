import type { Address } from 'wagmi'
import { useContractWrite, useWaitForTransaction, usePublicClient } from 'wagmi'
import type { WriteContractResult } from '@wagmi/core'

import { useChain } from '../contexts/chain'
import { useBetsCache } from './useBetsCache'
import type { Bet } from './useBets'


type SubmitProps = {
  bets: Array<Pick<Bet, 'tokenId' | 'coreAddress'>>
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

  const batchRedeemTx = useContractWrite({
    address: contracts.proxyFront.address,
    abi: contracts.proxyFront.abi,
    functionName: 'withdrawPayouts',
  })

  const receipt = useWaitForTransaction(redeemTx.data)
  const batchReceipt = useWaitForTransaction(batchRedeemTx.data)

  const submit = async (props: SubmitProps) => {
    const { bets } = props
    const isBatch = bets.length > 1

    let tx: WriteContractResult

    if (isBatch) {
      const betsData = bets.map(({ tokenId, coreAddress }) => ({
        core: coreAddress as Address,
        tokenId: BigInt(tokenId),
        isNative: false,
      }))

      tx = await batchRedeemTx.writeAsync({
        args: [ betsData ],
      })
    }
    else {
      const { tokenId, coreAddress } = bets[0]!

      tx = await redeemTx.writeAsync({
        args: [
          coreAddress,
          BigInt(tokenId),
        ],
      })
    }

    const receipt = await publicClient.waitForTransactionReceipt(tx)

    bets.forEach(({ tokenId, coreAddress }) => {
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
    isPending: redeemTx.isLoading || batchRedeemTx.isLoading,
    isProcessing: receipt.isLoading || batchReceipt.isLoading,
    data: redeemTx.data || batchReceipt.data,
    error: redeemTx.error || batchReceipt.error,
    submit,
  }
}
