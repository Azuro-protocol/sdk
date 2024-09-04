import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import type { Address } from 'viem'
import { freeBetAbi } from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'
import { useBetsCache } from '../useBetsCache'
import { type Bet } from '../../global'


type SubmitProps = {
  bets: Array<Pick<Bet, 'tokenId' | 'coreAddress' | 'freebetContractAddress' | 'freebetId'>>
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
    hash: batchRedeemTx.data,
  })

  const submit = async (props: SubmitProps) => {
    const { bets } = props
    const isBatch = bets.length > 1

    let hash: Address

    if (isBatch) {
      const betsData = bets.map(({ tokenId, coreAddress }) => ({
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
    }
    else {
      const { tokenId, coreAddress, freebetContractAddress, freebetId } = bets[0]!

      if (freebetContractAddress && freebetId) {
        hash = await redeemTx.writeContractAsync({
          address: freebetContractAddress,
          abi: freeBetAbi,
          functionName: 'withdrawPayout',
          args: [ BigInt(freebetId) ],
        })
      }
      else {
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
    }

    const receipt = await publicClient!.waitForTransactionReceipt({
      hash,
    })

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
    isPending: redeemTx.isPending || batchRedeemTx.isPending,
    isProcessing: receipt.isLoading || batchReceipt.isLoading,
    data: redeemTx.data || batchRedeemTx.data,
    error: redeemTx.error || batchRedeemTx.error,
    submit,
  }
}
