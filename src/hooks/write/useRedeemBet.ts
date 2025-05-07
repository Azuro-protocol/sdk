import { useWaitForTransactionReceipt, useSendTransaction, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { type Address, type Hex, encodeFunctionData } from 'viem'
import { freeBetAbi } from '@azuro-org/toolkit'
import { useState } from 'react'

import { useChain } from '../../contexts/chain'
import { useBetsCache } from '../useBetsCache'
import { type Bet } from '../../global'
import { useExtendedAccount, useAAWalletClient } from '../useAaConnector'
import { useBetTokenBalance } from '../useBetTokenBalance'
import { useNativeBalance } from '../useNativeBalance'


const legacyV2LpAbi = [
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'core', 'type': 'address',
      },
      { 'internalType': 'uint256', 'name': 'tokenId', 'type': 'uint256',
      },
    ], 'name': 'withdrawPayout', 'outputs': [
      { 'internalType': 'uint128', 'name': 'amount', 'type': 'uint128',
      },
    ], 'stateMutability': 'nonpayable', 'type': 'function',
  },
] as const

type SubmitProps = {
  bets: Array<Pick<Bet, 'tokenId' | 'coreAddress' | 'lpAddress' | 'freebetContractAddress' | 'freebetId'>>
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
  const { refetch: refetchBetTokenBalance } = useBetTokenBalance()
  const { refetch: refetchNativeBalance } = useNativeBalance()

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

    redeemTx.reset()
    setAaTxState({
      isPending: isAAWallet,
      data: undefined,
      error: null,
    })

    let data: Hex
    let to: Address

    const { freebetContractAddress, freebetId, coreAddress, lpAddress } = bets[0]!

    const isSameLp = new Set(bets.map(({ lpAddress }) => lpAddress)).size === 1

    if (!isSameLp) {
      throw new Error('redeem can\'t be executed for multiple lp contracts')
    }

    const isBatch = bets.length > 1
    const isV2 = lpAddress.toLowerCase() !== contracts.lp.address.toLowerCase()

    if (isBatch && isV2) {
      throw new Error('v2 redeem can\'t be executed for multiple bets')
    }

    if (freebetContractAddress && freebetId) {
      to = freebetContractAddress
      data = encodeFunctionData({
        abi: freeBetAbi,
        functionName: 'withdrawPayout',
        args: [ BigInt(freebetId) ],
      })
    }
    else if (isV2) {
      to = lpAddress
      data = encodeFunctionData({
        abi: legacyV2LpAbi,
        functionName: 'withdrawPayout',
        args: [
          coreAddress,
          BigInt(bets[0]!.tokenId),
        ],
      })
    }
    else {
      to = lpAddress
      data = encodeFunctionData({
        abi: contracts.lp.abi,
        functionName: 'withdrawPayouts',
        args: [
          coreAddress,
          bets.map(({ tokenId }) => BigInt(tokenId)),
        ],
      })
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

    refetchBetTokenBalance()
    refetchNativeBalance()

    bets.forEach(({ tokenId }) => {
      updateBetCache(
        tokenId,
        {
          isRedeemed: true,
          isRedeemable: false,
        },
        isV2
      )
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
