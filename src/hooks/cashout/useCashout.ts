import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useWalletClient, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { type Hex, type Address, type TransactionReceipt, encodeFunctionData, erc20Abi, formatUnits } from 'viem'
import {
  type Selection,
  CashoutState,
  createCashout,
  getCalculatedCashout,
  getCashout,
  getCashoutTypedData,
} from '@azuro-org/toolkit'
import { useReducer } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getEventArgsFromTxReceipt } from '../../helpers/getEventArgsFromTxReceipt'
import { useChain } from '../../contexts/chain'
import { useAAWalletClient, useExtendedAccount } from '../useAaConnector'
import { useBetsCache } from '../useBetsCache'
import { type PrecalculatedCashout } from './usePrecalculatedCashouts'
import { useBetTokenBalance } from '../useBetTokenBalance'
import { useNativeBalance } from '../useNativeBalance'


type Props = {
  tokenId: string
  selections: Selection[]
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

export const useCashout = (props: Props) => {
  const {
    tokenId, selections, EIP712Attention,
    onSuccess, onError,
  } = props

  const { appChain, contracts, api, betToken } = useChain()
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
    const conditionsKey = selections.map(({ conditionId, outcomeId }) => `${conditionId}/${outcomeId}`).join('-')
    const queryKey = [ 'cashout/precalculate', api, tokenId, conditionsKey ]

    // set precalculate query unavailable to cashout
    queryClient.setQueryData(queryKey, (oldPrecalcCashouts: Record<string, PrecalculatedCashout>) => {
      if (!oldPrecalcCashouts) {
        return oldPrecalcCashouts
      }

      const newPrecalcCashouts = { ...oldPrecalcCashouts }

      selections.forEach(({ conditionId, outcomeId }) => {
        const key = `${conditionId}-${outcomeId}`
        newPrecalcCashouts[key] = {
          ...newPrecalcCashouts[key]!,
          isAvailable: false,
        }
      })

      return newPrecalcCashouts
    })
  }

  // const isLive = selections[0]!.coreAddress.toLowerCase() === contracts.liveCore?.address.toLowerCase()
  const isLive = false // TODO
  // const betCoreAddress = selections[0]!.coreAddress as Address
  const betCoreAddress = '' as Address // TODO
  const betNftContractAddress = betCoreAddress.toLowerCase() === contracts.prematchComboCore.address.toLowerCase() ? (
    contracts.prematchComboCore.address
  ) : (
    contracts.azuroBet.address
  )

  const calculationQuery = useQuery({
    queryKey: [ 'cashout/calculate', api, account.address?.toLowerCase(), tokenId, isLive ],
    queryFn: () => getCalculatedCashout({
      chainId: appChain.id,
      account: account.address!,
      graphBetId: `${betCoreAddress.toLowerCase()}_${tokenId}`,
      isLive,
    }),
    refetchOnWindowFocus: false,
    retry: () => {
      updatePrecalculatedCache()

      return false // disable retries on error
    },
    gcTime: 0, // disable cache
    enabled: (
      // !isLive &&
      !!account.address
    ),
  })

  const { data: calculation } = calculationQuery
  const { calculationId, multiplier, expiredAt, approveExpiredAt } = calculation || {}
  const isCashoutAvailable = (
    // !isLive &&
    Boolean(calculationId)
  )

  const allowanceTx = useReadContract({
    chainId: appChain.id,
    address: betNftContractAddress,
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
      address: betNftContractAddress,
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
            to: betNftContractAddress,
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
        betCoreAddress,
        multiplier: multiplier!,
        expiredAt: expiredAt!,
      })

      const signature = isAAWallet
        ? await aaClient!.signTypedData({ ...typedData, account: aaClient!.account })
        : await walletClient!.data!.signTypedData(typedData)

      if (Date.now() >= approveExpiredAt!) {
        throw new Error('expired call')
      }

      const createdCashout = await createCashout({
        chainId: appChain.id,
        calculationId: calculationId!,
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

      updateBetCache({
        coreAddress: betCoreAddress,
        tokenId,
      }, {
        isCashedOut: true,
        cashout: {
          __typename: 'Cashout',
          payout: formatUnits(receiptArgs?.value || 0n, betToken.decimals),
        },
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
