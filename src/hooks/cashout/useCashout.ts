import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useWalletClient, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { type Hex, type Address, type TransactionReceipt, encodeFunctionData, erc20Abi, formatUnits } from 'viem'
import {
  type ChainId,

  CashoutState,
  createCashout,
  getCalculatedCashout,
  getCashout,
  getCashoutTypedData,
} from '@azuro-org/toolkit'
import { useReducer } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getEventArgsFromTxReceipt } from '../../helpers/getEventArgsFromTxReceipt'
import { useOptionalChain } from '../../contexts/chain'
import { type Bet } from '../../global'
import { useAAWalletClient, useExtendedAccount } from '../useAaConnector'
import { useBetsCache } from '../useBetsCache'
import { type PrecalculatedCashoutsQueryData } from './usePrecalculatedCashouts'
import { useBetTokenBalance } from '../useBetTokenBalance'
import { useNativeBalance } from '../useNativeBalance'


export type UseCashoutProps = {
  bet: Pick<Bet, 'tokenId' | 'outcomes'>
  chainId?: ChainId
  EIP712Attention?: string
  onSuccess?(receipt?: TransactionReceipt): void
  onError?(err?: Error): void
}

type CashoutTxState = {
  isPending: boolean
  data: Hex | undefined
}

const simpleObjReducer = (state: CashoutTxState, newState: Partial<CashoutTxState>) => ({
  ...state,
  ...newState,
})

export const useCashout = (props: UseCashoutProps) => {
  const {
    bet, EIP712Attention, chainId,
    onSuccess, onError,
  } = props
  const { tokenId, outcomes } = bet

  const { chain: appChain, contracts, api, betToken } = useOptionalChain(chainId)
  const { refetch: refetchBetTokenBalance } = useBetTokenBalance()
  const { refetch: refetchNativeBalance } = useNativeBalance()
  const { updateBetCache } = useBetsCache()
  const queryClient = useQueryClient()
  const account = useExtendedAccount()
  const isAAWallet = Boolean(account.isAAWallet)
  const aaClient = useAAWalletClient()
  const walletClient = useWalletClient()
  const wagmiConfig = useConfig()

  const [ cashoutTx, updateCashoutTx ] = useReducer(
    simpleObjReducer,
    {
      data: undefined, isPending: false,
    }
  )

  const updatePrecalculatedCache = () => {
    const queryKey = [ 'cashout/precalculate', api, tokenId ]

    // set precalculate query unavailable to cashout
    queryClient.setQueryData(queryKey, (oldPrecalcCashouts: PrecalculatedCashoutsQueryData) => {
      if (!oldPrecalcCashouts) {
        return oldPrecalcCashouts
      }

      const newPrecalcCashouts = { ...oldPrecalcCashouts.cashouts }

      outcomes.forEach(({ conditionId, outcomeId }) => {
        const key = `${conditionId}-${outcomeId}`
        newPrecalcCashouts[key] = {
          ...newPrecalcCashouts[key]!,
          isAvailable: false,
        }
      })

      return {
        ...oldPrecalcCashouts,
        cashouts: newPrecalcCashouts,
      }
    })
  }

  const calculationQuery = useQuery({
    queryKey: [ 'cashout/calculate', api, account.address?.toLowerCase(), tokenId ],
    queryFn: () => getCalculatedCashout({
      chainId: appChain.id,
      account: account.address!,
      graphBetId: `${contracts.core.address.toLowerCase()}_${tokenId}`,
    }),
    refetchOnWindowFocus: false,
    retry: () => {
      updatePrecalculatedCache()

      return false // disable retries on error
    },
    gcTime: 0, // disable cache
    enabled: (
      !!account.address
    ),
  })

  const { data: calculation } = calculationQuery
  const { calculationId, cashoutOdds, expiredAt, approveExpiredAt } = calculation || {}
  const isCashoutAvailable = (
    Boolean(calculationId)
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
      enabled: (
        Boolean(account.address) &&
        Boolean(contracts.cashout?.address) &&
        isCashoutAvailable
      ),
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

    await waitForTransactionReceipt(wagmiConfig, {
      hash,
      chainId: appChain.id,
    })

    allowanceTx.refetch()
  }

  const cashout = async () => {
    try {
      if (!isCashoutAvailable) {
        throw new Error('cashout unavailable')
      }

      updateCashoutTx({
        data: undefined,
        isPending: true,
      })

      // switch chain and approve
      if (isAAWallet && aaClient) {
        await aaClient.switchChain({ id: appChain.id })

        if (isApproveRequired) {
          const hash = await aaClient!.sendTransaction({
            to: contracts.azuroBet.address,
            data: encodeFunctionData({
              abi: contracts.azuroBet.abi,
              functionName: 'setApprovalForAll',
              args: [
                contracts.cashout?.address!,
                true,
              ],
            }),
          })

          await waitForTransactionReceipt(wagmiConfig, {
            hash,
            chainId: appChain.id,
          })
        }
      }

      const attention = EIP712Attention || 'By signing this transaction, I agree to cash out on \'Azuro SDK Example'

      const typedData = getCashoutTypedData({
        chainId: appChain.id,
        account: account.address!,
        attention,
        tokenId,
        cashoutOdds: cashoutOdds!,
        expiredAt: expiredAt!,
      })

      const signature = isAAWallet
        ? await aaClient!.signTypedData({ ...typedData, account: aaClient!.account as any })
        : await walletClient!.data!.signTypedData(typedData)

      if (Date.now() >= approveExpiredAt!) {
        throw new Error('expired call')
      }

      const createdCashout = await createCashout({
        chainId: appChain.id,
        calculationId: calculationId!,
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

      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: txHash,
        chainId: appChain.id,
      })

      if (receipt?.status === 'reverted') {
        updateCashoutTx({
          isPending: false,
          data: undefined,
        })
        throw new Error(`transaction ${receipt.transactionHash} was reverted`)
      }

      const receiptArgs = getEventArgsFromTxReceipt({
        receipt,
        eventName: 'Transfer',
        abi: erc20Abi,
        params: {
          to: account.address,
        },
      })

      refetchBetTokenBalance()
      refetchNativeBalance()
      allowanceTx.refetch()
      updatePrecalculatedCache()

      updateBetCache(tokenId, {
        isCashedOut: true,
        cashout: formatUnits(receiptArgs?.value || 0n, betToken.decimals),
      })

      onSuccess?.(receipt)
    }
    catch (err) {
      updateCashoutTx({
        isPending: false,
      })

      onError?.(err as any)
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
    calculationQuery,
    approveTx: {
      isPending: approveTx.isPending,
      isProcessing: approveReceipt.isLoading,
    },
    cashoutTx: {
      data: cashoutTx.data,
      receipt: cashoutReceipt.data,
      isPending: cashoutTx.isPending,
      isProcessing: cashoutReceipt.isLoading,
    },
    isAllowanceFetching: allowanceTx.isLoading,
    isCashoutAvailable,
    isApproveRequired,
  }
}
