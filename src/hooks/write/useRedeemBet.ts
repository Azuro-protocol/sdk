import { useWaitForTransactionReceipt, useSendTransaction, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { type Address, type Hex, encodeFunctionData } from 'viem'
import { useState } from 'react'
import { type ChainId, paymasterAbi } from '@azuro-org/toolkit'

import { useOptionalChain } from '../../contexts/chain'
import { useBetsCache } from '../useBetsCache'
import { type Bet } from '../../global'
import { useExtendedAccount, useAAWalletClient } from '../useAaConnector'
import { useBetTokenBalance } from '../useBetTokenBalance'
import { useNativeBalance } from '../useNativeBalance'


const legacyV2LpAbi = [
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'core', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'tokenId', 'type': 'uint256' },
    ],
    'name': 'withdrawPayout',
    'outputs': [
      {
        'internalType': 'uint128', 'name': 'amount', 'type': 'uint128',
      },
    ],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
] as const

const legacyV2FreebetAbi = [
  {
    'inputs': [
      { 'internalType': 'uint256', 'name': 'freeBetId', 'type': 'uint256' },
    ],
    'name': 'withdrawPayout',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
] as const

type SubmitProps = {
  bets: Array<Pick<Bet, 'tokenId' | 'coreAddress' | 'lpAddress' | 'freebetId' | 'paymaster'> & {
    freebetContractAddress?: Address
  }>
}

type AaTxState = {
  isPending: boolean
  data: Hex | undefined
  error: any
}

type Props = {
  chainId?: ChainId
}

export const useRedeemBet = ({ chainId }: Props = {}) => {
  const { contracts, chain: appChain } = useOptionalChain(chainId)
  const wagmiConfig = useConfig()
  const { updateBetCache } = useBetsCache(appChain.id)
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

    const { freebetContractAddress, freebetId, coreAddress, lpAddress, paymaster } = bets[0]!

    const isSameLp = new Set(bets.map(({ lpAddress }) => lpAddress)).size === 1

    if (!isSameLp) {
      throw new Error('redeem can\'t be executed for multiple lp contracts')
    }

    const isBatch = bets.length > 1
    const isV2 = lpAddress.toLowerCase() !== contracts.lp.address.toLowerCase()

    if (isBatch && isV2) {
      throw new Error('v2 redeem can\'t be executed for multiple bets')
    }

    if (freebetId) {
      if (freebetContractAddress) {
        to = freebetContractAddress
        data = encodeFunctionData({
          abi: legacyV2FreebetAbi,
          functionName: 'withdrawPayout',
          args: [ BigInt(freebetId) ],
        })
      }
      else {
        to = paymaster!
        data = encodeFunctionData({
          abi: paymasterAbi,
          functionName: 'withdrawPayouts',
          args: [ [ BigInt(freebetId) ] ],
        })
      }
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
          bets.filter(bet => !bet.freebetId).map(({ tokenId }) => BigInt(tokenId)),
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
