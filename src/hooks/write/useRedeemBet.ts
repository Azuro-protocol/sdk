import { useWaitForTransactionReceipt, useSendTransaction, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { type Address, type Hex, encodeFunctionData } from 'viem'
import { freeBetAbi } from '@azuro-org/toolkit'
import { useState } from 'react'

import { useChain } from '../../contexts/chain'
import { useBetsCache } from '../useBetsCache'
import { type Bet } from '../../global'
import { useExtendedAccount, useAAWalletClient } from '../useAaConnector'


type SubmitProps = {
  bets: Array<Pick<Bet, 'tokenId' | 'coreAddress' | 'freebetContractAddress' | 'freebetId'>>
}

type AaTxState = {
  isPending: boolean
  data: Hex | undefined
  error: any
}

export const useRedeemBet = () => {
  const { contracts, appChain } = useChain()
  const wagmiConfig = useConfig()
  const { updateBetCache } = useBetsCache()

  const redeemTx = useSendTransaction()
  const account = useExtendedAccount()
  const aaClient = useAAWalletClient()

  const [ aaTxState, setAaTxState ] = useState<AaTxState>({ isPending: false, data: undefined, error: null })

  const receipt = useWaitForTransactionReceipt({
    hash: aaTxState.data || redeemTx.data,
    query: {
      enabled: Boolean(aaTxState.data) || Boolean(redeemTx.data),
    },
  })

  const isAAWallet = Boolean(account.isAAWallet)

  const submit = async (props: SubmitProps) => {
    const { bets } = props
    const isBatch = bets.length > 1

    redeemTx.reset()
    setAaTxState({
      isPending: isAAWallet,
      data: undefined,
      error: null,
    })

    let data: Hex
    let to: Address

    if (isBatch) {
      const betsData = bets.map(({ tokenId, coreAddress }) => ({
        core: coreAddress as Address,
        tokenId: BigInt(tokenId),
        isNative: false,
      }))

      to = contracts.proxyFront.address
      data = encodeFunctionData({
        abi: contracts.proxyFront.abi,
        functionName: 'withdrawPayouts',
        args: [ betsData ],
      })
    }
    else {
      const { tokenId, coreAddress, freebetContractAddress, freebetId } = bets[0]!

      if (freebetContractAddress && freebetId) {
        to = freebetContractAddress
        data = encodeFunctionData({
          abi: freeBetAbi,
          functionName: 'withdrawPayout',
          args: [ BigInt(freebetId) ],
        })
      }
      else {
        to = contracts.lp.address
        data = encodeFunctionData({
          abi: contracts.lp.abi,
          functionName: 'withdrawPayout',
          args: [
            coreAddress,
            BigInt(tokenId),
          ],
        })
      }
    }

    let hash: Hex

    if (isAAWallet) {
      try {
        hash = await aaClient!.sendTransaction({ to, data, chain: appChain })

        setAaTxState({
          data: hash,
          isPending: false,
          error: null,
        })
      }
      catch (error: any) {
        setAaTxState({
          data: undefined,
          isPending: false,
          error,
        })

        throw error
      }
    }
    else {
      hash = await redeemTx.sendTransactionAsync({ to, data })
    }

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
      chainId: appChain.id,
    })

    if (receipt?.status === 'reverted') {
      redeemTx.reset()
      setAaTxState({
        isPending: false,
        data: undefined,
        error: null,
      })
      throw new Error(`transaction ${receipt.transactionHash} was reverted`)
    }

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
    isPending: redeemTx.isPending || aaTxState.isPending,
    isProcessing: receipt.isLoading,
    data: redeemTx.data || aaTxState.data,
    error: redeemTx.error || aaTxState.error,
    submit,
  }
}
