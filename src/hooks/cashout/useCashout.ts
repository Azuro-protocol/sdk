import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient, useBalance } from 'wagmi'
import { type Hex, type Address } from 'viem'
import { CashoutState, createCashout, getCashout, getCashoutTypedData } from '@azuro-org/toolkit'
import { useReducer } from 'react'

import { useChain } from '../../contexts/chain'
import { useAAWalletClient, useExtendedAccount } from '../useAaConnector'


type Props = {
  tokenId: string
  betCoreAddress: Address
  calculationId: string
  multiplier: string
  expiredAt: number
  EIP712Attention?: string
}

type CashoutTxState = {
  isPending: boolean
  data: Hex | undefined
}

const simpleObjReducer = (state: CashoutTxState, newState: Partial<CashoutTxState>) => ({
  ...state,
  ...newState,
})

export const useCashout = (props: Props) => {
  const { tokenId, betCoreAddress, calculationId, multiplier, expiredAt, EIP712Attention } = props

  const { appChain, contracts, api, betToken } = useChain()
  const account = useExtendedAccount()
  const isAAWallet = Boolean(account.isAAWallet)
  const aaClient = useAAWalletClient()
  const walletClient = useWalletClient()
  const publicClient = usePublicClient()
  const { refetch: refetchBalance } = useBalance({
    chainId: appChain.id,
    address: account.address,
    token: betToken.address,
  })

  const [ cashoutTx, updateCashoutTx ] = useReducer(
    simpleObjReducer,
    {
      data: undefined, isPending: false,
    }
  )

  const allowanceTx = useReadContract({
    chainId: appChain.id,
    address: contracts.azuroBet.address,
    abi: contracts.azuroBet.abi,
    functionName: 'isApprovedForAll',
    args: [
      account.address!,
      contracts.cashout?.address!,
    ],
    query: {
      enabled: Boolean(account.address) && Boolean(contracts.cashout?.address),
    },
  })

  const isApproveRequired = (
    !allowanceTx.isLoading &&
    !allowanceTx.data
  )

  const approveTx = useWriteContract()
  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveTx.data,
  })

  const cashoutReceipt = useWaitForTransactionReceipt({
    hash: cashoutTx.data,
  })

  const approve = async () => {
    const hash = await approveTx.writeContractAsync({
      address: contracts.azuroBet.address,
      abi: contracts.azuroBet.abi,
      functionName: 'setApprovalForAll',
      args: [
        contracts.cashout?.address!,
        true,
      ],
    })

    await publicClient!.waitForTransactionReceipt({
      hash,
    })

    allowanceTx.refetch()
  }

  const cashout = async () => {
    updateCashoutTx({
      data: undefined,
      isPending: true,
    })

    if (isAAWallet && aaClient) {
      await aaClient.switchChain({ id: appChain.id })
    }

    try {
      const attention = EIP712Attention || 'By signing this transaction, I agree to cash out on \'Azuro SDK Example'

      const typedData = getCashoutTypedData({
        chainId: appChain.id,
        account: account.address!,
        attention,
        tokenId,
        betCoreAddress,
        multiplier,
        expiredAt,
      })

      const signature = isAAWallet
        ? await aaClient!.signTypedData({ ...typedData, account: aaClient!.account })
        : await walletClient!.data!.signTypedData(typedData)

      const createdCashout = await createCashout({
        chainId: appChain.id,
        calculationId,
        betCoreAddress,
        attention,
        signature,
      })

      const {
        id: orderId,
        state: newOrderState,
        errorMessage,
      } = createdCashout!

      let txHash: Hex

      if (newOrderState && newOrderState !== CashoutState.Rejected) {
        txHash = await new Promise<Hex>((res, rej) => {
          const interval = setInterval(async () => {
            const order = await getCashout({
              chainId: appChain.id,
              orderId,
            })

            const { state, txHash, errorMessage } = order!

            if (state === CashoutState.Rejected) {
              clearInterval(interval)
              rej(errorMessage)
            }

            if (txHash) {
              clearInterval(interval)
              res(txHash as Hex)
            }
          }, 1000)
        })
      }
      else {
        throw Error(errorMessage)
      }

      updateCashoutTx({
        data: txHash,
        isPending: false,
      })

      const receipt = await publicClient!.waitForTransactionReceipt({
        hash: txHash,
      })

      console.log(receipt, 'receipt')

      refetchBalance()
      allowanceTx.refetch()

      // if (onSuccess) {
      //   onSuccess(receipt)
      // }
    }
    catch (err) {
      updateCashoutTx({
        isPending: false,
      })

      // if (onError) {
      //   onError(err as any)
      // }
    }
  }

  const submit = () => {
    if (isApproveRequired && !isAAWallet) {
      return approve()
    }

    return cashout()
  }

  return {
    submit,
    approveTx: {
      isPending: approveTx.isPending,
      isProcessing: approveReceipt.isLoading,
    },
    cashoutTx: {
      data: cashoutTx.data,
      isPending: cashoutTx.isPending,
      isProcessing: cashoutReceipt.isLoading,
    },
    isAllowanceFetching: allowanceTx.isLoading,
    isApproveRequired,
  }
}
