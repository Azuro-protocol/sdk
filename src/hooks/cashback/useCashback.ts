import { useState } from 'react'
import { type Hex, type Address } from 'viem'
import { useConfig, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import type { CashbackTransaction } from '@azuro-org/toolkit'
import { createCashbackTransaction } from '@azuro-org/toolkit'
import { waitForTransactionReceipt } from 'wagmi/actions'

import { useAAWalletClient, useExtendedAccount } from '../useAaConnector'
import { useChain } from '../../contexts/chain'
import { useCashbackBalance } from './useCashbackBalance'
import { useBetTokenBalance } from '../useBetTokenBalance'
import { useNativeBalance } from '../useNativeBalance'


type AaTxState = {
  isPending: boolean
  data: Hex | undefined
  error: any
}

type Props = {
  affiliate: Address
}

export const useCashback = ({ affiliate }: Props) => {
  const [ aaTxState, setAaTxState ] = useState<AaTxState>({ isPending: false, data: undefined, error: null })
  const [ isTxFetching, setTxFetching ] = useState(false)

  const { refetch: refetchCashbackBalance } = useCashbackBalance({ affiliate })
  const { refetch: refetchBetTokenBalance } = useBetTokenBalance()
  const { refetch: refetchNativeBalance } = useNativeBalance()
  const { appChain } = useChain()
  const account = useExtendedAccount()
  const aaClient = useAAWalletClient()
  const wagmiConfig = useConfig()

  const cashbackTx = useSendTransaction()

  const isAAWallet = Boolean(account.isAAWallet)

  const receipt = useWaitForTransactionReceipt({
    hash: aaTxState.data || cashbackTx.data,
    query: {
      enabled: Boolean(aaTxState.data) || Boolean(cashbackTx.data),
    },
  })

  const submit = async () => {
    setTxFetching(true)
    cashbackTx.reset()
    setAaTxState({
      isPending: isAAWallet,
      data: undefined,
      error: null,
    })

    let tx: CashbackTransaction | null

    try {
      tx = await createCashbackTransaction({
        account: account.address!,
        affiliate,
        expiresAt: Math.floor(Date.now() / 1000) + 2000,
        chainId: appChain.id,
      })
    }
    catch (error) {
      setTxFetching(false)

      throw error
    }

    let hash: Hex

    if (isAAWallet) {
      try {
        hash = await aaClient!.sendTransaction({ ...tx, chain: appChain })

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
      hash = await cashbackTx.sendTransactionAsync(tx!)
    }

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
      chainId: appChain.id,
    })

    if (receipt?.status === 'reverted') {
      cashbackTx.reset()
      setAaTxState({
        isPending: false,
        data: undefined,
        error: null,
      })
      throw new Error(`transaction ${receipt.transactionHash} was reverted`)
    }

    refetchCashbackBalance()
    refetchBetTokenBalance()
    refetchNativeBalance()

    return receipt
  }

  return {
    isPending: isTxFetching || cashbackTx.isPending || aaTxState.isPending,
    isProcessing: receipt.isLoading,
    data: cashbackTx.data || aaTxState.data,
    error: cashbackTx.error || aaTxState.error,
    submit,
  }
}
