import { parseUnits, encodeFunctionData, erc20Abi, zeroAddress } from 'viem'
import { type TransactionReceipt, type Address, type Hex } from 'viem'
import { getTransactionReceipt } from '@wagmi/core'
import { useQuery } from '@tanstack/react-query'
import { useAccount, useConfig, usePublicClient, useReadContract, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { useState } from 'react'

import { useApolloClients } from 'src/contexts/apollo'

import { DEFAULT_DEADLINE, MAX_UINT_256, ODDS_DECIMALS, deBridgeTxUrl, deBridgeUrl, liveHostAddress } from '../config'
import { useChain } from '../contexts/chain'
import { type Selection } from '../global'
import { useDeBridgeSupportedChains } from './useDeBridgeSupportedChains'
import { getPrematchBetDataBytes } from '../helpers/getPrematchBetDataBytes'
import useDebounce from '../helpers/hooks/useDebounce'
import { useBetsCache } from './useBetsCache'


type DeBridgeCreateTxResponse = {
  orderId: Hex
  estimation: {
    srcChainTokenIn: {
      address: Address
      name: string
      symbol: string
      decimals: number
      amount: string
      approximateOperatingExpense: string
      mutatedWithOperatingExpense: boolean
    },
    srcChainTokenOut: {
      address: Address
      name: string
      symbol: string
      decimals: number
      amount: string
      maxRefundAmount: string
    }
    dstChainTokenOut: {
      address: Address
      name: string
      symbol: string
      decimals: number
      amount: string
      recommendedAmount: string
      withoutAdditionalTakerRewardsAmount: string
      maxTheoreticalAmount: string
    },
    recommendedSlippage: number
    costsDetails: [ string ]
  }
  tx: {
    to: Address
    data: Hex
    value: bigint
  }
  order: {
    approximateFulfillmentDelay: number
  },
  prependedOperatingExpenseCost: string
  fixFee: string
  userPoints: number
  integratorPoints: number
}

enum DeBridgeOrderStatus {
  None = 'None',
  Created = 'Created',
  Fulfilled = 'Fulfilled',
  SentUnlock = 'SentUnlock',
  OrderCancelled = 'OrderCancelled',
  SentOrderCancel = 'SentOrderCancel',
  ClaimedUnlock = 'ClaimedUnlock',
  ClaimedOrderCancel = 'ClaimedOrderCancel',
}

enum DeBridgeExternalCallStatus {
  NoExtCall = 'NoExtCall',
  AwaitingOrderFulfillment = 'AwaitingOrderFulfillment',
  AwaitingExecution = 'AwaitingExecution',
  Executing = 'Executing',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
}

type DeBridgeOrderStatusResponse = {
  orderId: Hex
  status: DeBridgeOrderStatus
  externalCallState: DeBridgeExternalCallStatus
}

type DeBridgeOrderTxResponse = {
  fulfilledDstEventMetadata: {
    transactionHash: {
      stringValue: string
    }
  }
}

type Props = {
  fromChainId: number
  fromTokenAddress: string
  betAmount: string
  slippage: number
  affiliate: Address
  selections: Selection[]
  odds: Record<string, number>
  totalOdds: number
  deadline?: number
  onSuccess?(receipt?: TransactionReceipt): void
  onError?(err?: Error): void
}

export const useDeBridgeBet = (props: Props) => {
  const { fromChainId: _fromChainId, fromTokenAddress: _fromTokenAddress, betAmount: _betAmount, slippage, deadline, affiliate, selections, odds, totalOdds, onSuccess, onError } = props

  const { prematchClient } = useApolloClients()
  const { addBet } = useBetsCache()
  const publicClient = usePublicClient()
  const config = useConfig()
  const account = useAccount()
  const { appChain, betToken, contracts } = useChain()

  const [ isBetPending, setBetPending ] = useState(false)
  const [ isBetProcessing, setBetProcessing ] = useState(false)

  const isLiveBet = selections.some(({ coreAddress }) => coreAddress === liveHostAddress)

  const betAmount = useDebounce(_betAmount, 300)
  const fromChainId = useDebounce(_fromChainId, 300)
  const fromTokenAddress = useDebounce(_fromTokenAddress, 300)

  const {
    supportedChainIds,
    loading: isDeBridgeSupportedChainsFetching,
  } = useDeBridgeSupportedChains({
    enabled: !isLiveBet,
  })

  const queryFn = async () => {
    const fixedAmount = +parseFloat(String(betAmount)).toFixed(betToken.decimals)
    const minOdds = 1 + (+totalOdds - 1) * (100 - slippage) / 100
    const fixedMinOdds = +parseFloat(String(minOdds)).toFixed(ODDS_DECIMALS)
    const coreAddress = selections.length > 1 ? contracts.prematchComboCore.address : contracts.prematchCore.address
    const betData = getPrematchBetDataBytes(selections)

    const rawAmount = parseUnits(`${fixedAmount}`, betToken.decimals)
    const rawMinOdds = parseUnits(`${fixedMinOdds}`, ODDS_DECIMALS)
    const rawDeadline = BigInt(Math.floor(Date.now() / 1000) + (deadline || DEFAULT_DEADLINE))

    const params = new URLSearchParams({
      dstChainId: String(appChain.id),
      srcChainOrderAuthorityAddress: account.address as string,
      prependOperatingExpenses: 'false',
      srcChainId: String(fromChainId),
      srcChainTokenIn: fromTokenAddress,
      srcChainTokenInAmount: 'auto',
      dstChainTokenOut: betToken.address as string,
      dstChainTokenOutAmount: String(rawAmount),
      dstChainTokenOutRecipient: account.address as string,
      dstChainOrderAuthorityAddress: account.address as string,
      externalCall: JSON.stringify({
        version: 'evm_1',
        fields: {
          to: contracts.lp.address,
          data: encodeFunctionData({
            abi: contracts.lp.abi,
            functionName: 'betFor',
            args: [
              account.address!,
              coreAddress,
              rawAmount,
              rawDeadline,
              {
                affiliate,
                minOdds: rawMinOdds,
                data: betData,
              },
            ],
          }),
        },
      }),
      referralCode: '9126',
    })
    const deBridgeCreateTxResponse = await fetch(`${deBridgeUrl}/dln/order/create-tx?${params}`)
    const data: DeBridgeCreateTxResponse = await deBridgeCreateTxResponse.json()

    return data
  }

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
      && Boolean(betAmount)
      && Boolean(selections.length)
      && !isDeBridgeSupportedChainsFetching
      && (supportedChainIds || []).includes(appChain.id)
      && (supportedChainIds || []).includes(fromChainId)
    ),
    refetchOnWindowFocus: false,
    refetchInterval: 20000,
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
          MAX_UINT_256,
        ],
      })
      await publicClient!.waitForTransactionReceipt({
        hash,
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
      const hash = await betTx.sendTransactionAsync(betTxData!)

      setBetPending(false)
      setBetProcessing(true)

      await publicClient!.waitForTransactionReceipt({
        hash,
      })

      const txHash = await new Promise<Hex>((res, rej) => {
        const interval = setInterval(async () => {
          const orderResponse = await fetch(`${deBridgeUrl}/dln/order/${orderId}`)
          const order: DeBridgeOrderStatusResponse = await orderResponse.json()
          const {
            status: orderStatus,
            externalCallState: betPlacingStatus,
          } = order

          const isBetPlaced = betPlacingStatus === DeBridgeExternalCallStatus.Completed
          const isOrderFulfilled = isBetPlaced || orderStatus === DeBridgeOrderStatus.Fulfilled || orderStatus === DeBridgeOrderStatus.ClaimedUnlock

          if (isOrderFulfilled) {
            clearInterval(interval)

            const orderTxResponse = await fetch(`${deBridgeTxUrl}/orders/${orderId}`)
            const { fulfilledDstEventMetadata }: DeBridgeOrderTxResponse = await orderTxResponse.json()

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
        }, 5000)
      })

      let receipt: TransactionReceipt | undefined

      if (txHash) {
        receipt = await getTransactionReceipt(config, {
          hash: txHash,
          chainId: appChain.id,
        })

        if (receipt) {
          const fixedAmount = +parseFloat(String(betAmount)).toFixed(betToken.decimals)

          addBet({
            receipt,
            bet: {
              amount: `${fixedAmount}`,
              selections,
              odds,
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
    if (isApproveRequired) {
      return approve()
    }

    return placeBet()
  }

  return {
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
