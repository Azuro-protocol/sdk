import { usePublicClient, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { useState } from 'react'
import { encodeFunctionData, type Hex, parseUnits } from 'viem'
import { base, baseSepolia, gnosis } from 'viem/chains'

import { useChain } from '../contexts/chain'
import { formatToFixed } from '../helpers'
import { useBetTokenBalance } from './useBetTokenBalance'
import { useNativeBalance } from './useNativeBalance'
import { useAAWalletClient, useExtendedAccount } from './useAaConnector'


const wrapAbi = [
  {
    'constant': false,
    'inputs': [],
    'name': 'deposit',
    'outputs': [],
    'payable': true,
    'stateMutability': 'payable',
    'type': 'function',
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'wad',
        'type': 'uint256',
      },
    ],
    'name': 'withdraw',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
] as const

export const WRAP_CHAINS = [ gnosis.id, base.id, baseSepolia.id ] as number[]

type AaTxState = {
  data: Hex | undefined
  isPending: boolean
}

export const useWrapTokens = () => {
  const account = useExtendedAccount()
  const aaClient = useAAWalletClient()
  const publicClient = usePublicClient()
  const depositTx = useSendTransaction()
  const withdrawTx = useSendTransaction()
  const { appChain, betToken } = useChain()
  const { refetch: refetchBetTokenBalance } = useBetTokenBalance()
  const { refetch: refetchNativeBalance } = useNativeBalance()

  const [ aaDepositTxState, setAaDepositTxState ] = useState<AaTxState>({
    data: undefined,
    isPending: false,
  })

  const [ aaWithdrawTxState, setAaWithdrawTxState ] = useState<AaTxState>({
    data: undefined,
    isPending: false,
  })

  const depositReceipt = useWaitForTransactionReceipt({
    hash: aaDepositTxState.data || depositTx.data,
    query: {
      enabled: Boolean(aaDepositTxState.data) || Boolean(depositTx.data),
    },
  })

  const withdrawReceipt = useWaitForTransactionReceipt({
    hash: aaWithdrawTxState.data || withdrawTx.data,
    query: {
      enabled: Boolean(aaWithdrawTxState.data) || Boolean(withdrawTx.data),
    },
  })

  const isAAWallet = Boolean(account.isAAWallet)

  const wrap = async (amount: string) => {
    if (!WRAP_CHAINS.includes(appChain.id)) {
      throw new Error('insufficient chain, please use Gnosis or Base')
    }

    depositTx.reset()
    setAaDepositTxState({
      isPending: isAAWallet,
      data: undefined,
    })

    const fixedAmount = formatToFixed(amount, appChain.nativeCurrency.decimals)
    const rawAmount = parseUnits(fixedAmount, appChain.nativeCurrency.decimals)

    const tx = {
      to: betToken.address!,
      value: rawAmount,
      data: encodeFunctionData({
        abi: wrapAbi,
        functionName: 'deposit',
      }),
    }

    let hash: Hex

    if (isAAWallet) {
      try {
        hash = await aaClient!.sendTransaction({ ...tx, chain: appChain })

        setAaDepositTxState({
          data: hash,
          isPending: false,
        })
      }
      catch (error: any) {
        setAaDepositTxState({
          data: undefined,
          isPending: false,
        })

        throw error
      }
    }
    else {
      hash = await depositTx.sendTransactionAsync(tx)
    }

    const receipt = await publicClient!.waitForTransactionReceipt({
      hash,
    })

    refetchBetTokenBalance()
    refetchNativeBalance()

    return receipt
  }

  const unwrap = async (amount: string) => {
    if (!WRAP_CHAINS.includes(appChain.id)) {
      throw new Error('insufficient chain, please use Gnosis or Base')
    }

    withdrawTx.reset()
    setAaWithdrawTxState({
      isPending: isAAWallet,
      data: undefined,
    })

    const fixedAmount = formatToFixed(amount, betToken.decimals)
    const rawAmount = parseUnits(fixedAmount, betToken.decimals)

    const tx = {
      to: betToken.address!,
      data: encodeFunctionData({
        abi: wrapAbi,
        functionName: 'withdraw',
        args: [ rawAmount ],
      }),
    }

    let hash: Hex

    if (isAAWallet) {
      try {
        hash = await aaClient!.sendTransaction({ ...tx, chain: appChain })

        setAaWithdrawTxState({
          data: hash,
          isPending: false,
        })
      }
      catch (error: any) {
        setAaWithdrawTxState({
          data: undefined,
          isPending: false,
        })

        throw error
      }
    }
    else {
      hash = await withdrawTx.sendTransactionAsync(tx)
    }

    const receipt = await publicClient!.waitForTransactionReceipt({
      hash,
    })

    refetchBetTokenBalance()
    refetchNativeBalance()

    return receipt
  }

  return {
    wrap,
    unwrap,
    wrapTx: {
      data: depositTx.data || aaDepositTxState.data,
      receipt: depositReceipt.data,
      isPending: depositTx.isPending || aaDepositTxState.isPending,
      isProcessing: depositReceipt.isLoading,
    },
    unwrapTx: {
      data: withdrawTx.data || aaWithdrawTxState.data,
      receipt: withdrawReceipt.data,
      isPending: withdrawTx.isPending || aaWithdrawTxState.isPending,
      isProcessing: withdrawReceipt.isLoading,
    },
  }
}
