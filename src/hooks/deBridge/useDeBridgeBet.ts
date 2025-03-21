import { type TransactionReceipt, type Address, type Hex, maxUint256, parseUnits, erc20Abi, zeroAddress } from 'viem'
import { waitForTransactionReceipt, getTransactionReceipt } from 'wagmi/actions'
import { useQuery } from '@tanstack/react-query'
import { useConfig, useReadContract, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { useState, useEffect } from 'react'
import {
  type Selection,
  liveHostAddress,

  DeBridgeOrderStatus,
  DeBridgeExternalCallStatus,
  createDeBridgeBet,
  getDeBridgeOrder,
} from '@azuro-org/toolkit'

import { useApolloClients } from '../../contexts/apollo'
import { useChain } from '../../contexts/chain'
import { useBetsCache } from '../useBetsCache'
import { useDeBridgeSupportedChains } from './useDeBridgeSupportedChains'
import { useDeBridgeSupportedTokens } from './useDeBridgeSupportedTokens'
import { useExtendedAccount } from '../useAaConnector'


type Props = {
  fromChainId: number
  fromTokenAddress: string
  betAmount: string
  slippage: number
  referralCode: number
  affiliate: Address
  selections: Selection[]
  odds: Record<string, number>
  totalOdds: number
  deadline?: number
  onSuccess?(receipt?: TransactionReceipt): void
  onError?(err?: Error): void
}

export const useDeBridgeBet = (props: Props) => {
  const {
    fromChainId, fromTokenAddress, betAmount,
    slippage, deadline, referralCode, affiliate, selections, odds, totalOdds, onSuccess, onError,
  } = props

  const { appChain, betToken } = useChain()
  const { prematchClient } = useApolloClients()
  const { addBet } = useBetsCache()
  const wagmiConfig = useConfig()
  const account = useExtendedAccount()

  const [ isBetPending, setBetPending ] = useState(false)
  const [ isBetProcessing, setBetProcessing ] = useState(false)

  const isLiveBet = selections.some(({ coreAddress }) => coreAddress === liveHostAddress)

  useEffect(() => {
    if (account.isAAWallet) {
      console.warn('Azuro SDK: deBridge must not be used with AA wallets.')
    }
  }, [ account.isAAWallet ])

  const {
    supportedChainIds,
    loading: isDeBridgeSupportedChainsFetching,
  } = useDeBridgeSupportedChains({
    enabled: !isLiveBet,
  })

  const {
    supportedTokenAddresses,
    loading: isDeBridgeSupportedTokensFetching,
  } = useDeBridgeSupportedTokens({
    chainId: fromChainId,
    enabled: !isLiveBet && !isDeBridgeSupportedChainsFetching && (supportedChainIds || []).includes(fromChainId),
  })

  const queryFn = () => (
    createDeBridgeBet({
      account: account.address!,
      betAmount,
      dstChainId: appChain.id,
      srcChainId: fromChainId,
      srcChainTokenIn: fromTokenAddress,
      selections,
      totalOdds,
      slippage,
      deadline,
      affiliate,
      referralCode,
    })
  )

  const selectionsKey = selections.map(({ conditionId }) => conditionId).join('-')

  const { isFetching: isCreateTxFetching, data } = useQuery({
    queryKey: [ '/debridge-create-tx', fromChainId, fromTokenAddress, account?.address, betAmount, selectionsKey, totalOdds, slippage ],
    queryFn,
    enabled: (
      !isLiveBet
      && !isBetPending
      && !isBetProcessing
      && Boolean(fromChainId)
      && Boolean(fromTokenAddress)
      && Boolean(account)
      && Boolean(+betAmount)
      && Boolean(selections.length)
      && Boolean(totalOdds) && totalOdds !== 1
      && !isDeBridgeSupportedChainsFetching
      && !isDeBridgeSupportedTokensFetching
      && (supportedChainIds || []).includes(appChain.id)
      && (supportedChainIds || []).includes(fromChainId)
      && (supportedTokenAddresses || []).includes(fromTokenAddress)
    ),
    refetchOnWindowFocus: false,
    refetchInterval: 20_000,
  })

  const { orderId, estimation, tx: betTxData, fixFee } = data || {}

  const isTxReady = Boolean(betTxData)
  const isNative = estimation?.srcChainTokenIn?.address === zeroAddress

  const allowanceTx = useReadContract({
    chainId: fromChainId,
    address: estimation?.srcChainTokenIn.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [
      account.address!,
      betTxData?.to as Address,
    ],
    query: {
      enabled: !isNative && Boolean(account.address) && isTxReady,
      refetchOnWindowFocus: false,
    },
  })

  const isApproveRequired = Boolean(
    allowanceTx.data !== undefined
    && allowanceTx.data < (BigInt(estimation?.srcChainTokenIn?.amount || 0) * 4n / 3n)
  )

  const approveTx = useWriteContract()
  const betTx = useSendTransaction()

  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveTx.data,
    query: {
      enabled: Boolean(approveTx.data),
    },
  })

  const approve = async () => {
    try {
      const hash = await approveTx.writeContractAsync({
        address: estimation?.srcChainTokenIn.address!,
        abi: erc20Abi,
        chainId: fromChainId,
        functionName: 'approve',
        args: [
          betTxData?.to as Address,
          maxUint256,
        ],
      })

      await waitForTransactionReceipt(wagmiConfig, {
        hash,
        chainId: appChain.id,
      })

      allowanceTx.refetch()
    }
    catch (err: any) {
      onError?.(err)
    }
  }

  const placeBet = async () => {
    try {
      setBetPending(true)
      await betTx.sendTransactionAsync(betTxData!)

      setBetPending(false)
      setBetProcessing(true)

      const txHash = await new Promise<Hex>((res, rej) => {
        const interval = setInterval(async () => {
          try {
            const order = await getDeBridgeOrder(orderId!)
            const {
              state: orderStatus,
              externalCallState: betPlacingStatus,
              fulfilledDstEventMetadata,
            } = order!

            const isBetPlaced = betPlacingStatus === DeBridgeExternalCallStatus.Completed
            const isOrderFulfilled = isBetPlaced || orderStatus === DeBridgeOrderStatus.Fulfilled || orderStatus === DeBridgeOrderStatus.ClaimedUnlock

            if (isOrderFulfilled) {
              clearInterval(interval)

              res(fulfilledDstEventMetadata?.transactionHash?.stringValue as Hex)
            }

            let error = ''

            if (betPlacingStatus === DeBridgeExternalCallStatus.Cancelled) {
              error = DeBridgeExternalCallStatus.Cancelled
            }

            if (betPlacingStatus === DeBridgeExternalCallStatus.Failed) {
              error = DeBridgeExternalCallStatus.Failed
            }

            if (orderStatus === DeBridgeOrderStatus.SentOrderCancel) {
              error = DeBridgeOrderStatus.SentOrderCancel
            }

            if (orderStatus === DeBridgeOrderStatus.OrderCancelled) {
              error = DeBridgeOrderStatus.OrderCancelled
            }

            if (error) {
              clearInterval(interval)
              rej(error)
            }
          }
          catch {}
        }, 5000)
      })

      let receipt: TransactionReceipt | undefined

      if (txHash) {
        receipt = await getTransactionReceipt(wagmiConfig, {
          hash: txHash,
          chainId: appChain.id,
        })

        if (receipt?.status === 'reverted') {
          betTx.reset()
          throw new Error(`transaction ${receipt.transactionHash} was reverted`)
        }

        if (receipt) {
          const fixedAmount = parseFloat(betAmount).toFixed(betToken.decimals)
          const rawAmount = parseUnits(fixedAmount, betToken.decimals)

          addBet({
            receipt,
            affiliate,
            odds,
            bet: {
              rawAmount,
              selections,
            },
          })
        }
      }
      else {
        prematchClient!.refetchQueries({
          include: [ 'Bets' ],
        })
      }

      setBetProcessing(false)
      onSuccess?.(receipt)
    }
    catch (err: any) {
      setBetPending(false)
      setBetProcessing(false)
      onError?.(err)
    }
  }

  const submit = () => {
    if (account.isAAWallet) {
      console.error('Azuro SDK: deBridge must not be used with AA wallets.')

      return
    }

    if (isApproveRequired) {
      return approve()
    }

    return placeBet()
  }

  return {
    orderId,
    submit,
    estimation,
    fixFee,
    supportedChainIds,
    approveTx: {
      isPending: approveTx.isPending,
      isProcessing: approveReceipt.isLoading,
    },
    betTx: {
      isPending: isBetPending,
      isProcessing: isBetProcessing,
    },
    isAllowanceLoading: allowanceTx.isLoading,
    isApproveRequired,
    isTxReady,
    loading: isCreateTxFetching || isDeBridgeSupportedChainsFetching,
  }
}
