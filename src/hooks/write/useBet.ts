import {
  type BetClientData, BetOrderState, calcMinOdds, type ChainId, createBet, type CreateBetResult, createComboBet,
  type Freebet, getBet, getBetTypedData, getComboBetTypedData, ODDS_DECIMALS, type Selection,
} from '@azuro-org/toolkit'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useReducer } from 'react'
import {
  type Address, encodeFunctionData, erc20Abi, type Hex, maxUint256, parseUnits, type TransactionReceipt,
} from 'viem'
import { useConfig, useReadContract, useWaitForTransactionReceipt, useWalletClient, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { DEFAULT_DEADLINE } from '../../config'
import { useOptionalChain } from '../../contexts/chain'

import { BetType } from '../../global'
import { formatToFixed } from '../../helpers/formatToFixed'
import { useBetFee } from '../data/useBetFee'
import { useAAWalletClient, useExtendedAccount } from '../useAaConnector'
import { useBetTokenBalance } from '../useBetTokenBalance'
import { useNativeBalance } from '../useNativeBalance'


export class BetOrderError extends Error {
  orderId: string
  orderState: BetOrderState
  errorCode: string | undefined | null

  constructor(
    errorMessage: string,
    args: {
      cause?: Error
      orderState: BetOrderState
      orderId: string
      errorCode?: string | null
    }
  ) {
    super(errorMessage || args.errorCode || args.orderState, args?.cause ? { cause: args.cause } : undefined)

    this.orderId = args.orderId
    this.orderState = args.orderState
    this.errorCode = args.errorCode
  }
}

type UseBetProps = {
  // betAmount: string | Record<string, string>
  betAmount: string
  slippage: number
  affiliate: Address
  selections: Selection[]
  odds: Record<string, number>
  totalOdds: number
  chainId?: ChainId
  freebet?: Pick<Freebet, 'id' | 'params'>
  EIP712Attention?: string
  deadline?: number
  onBetOrderCreated?(order: CreateBetResult): void
  onSuccess?(receipt?: TransactionReceipt): void
  onError?(err?: Error): void
}

type BetTxState = {
  isPendingTransaction: boolean
  data: Hex | undefined
  orderId: string | undefined
  isPendingOrderPlacing: boolean
}

const simpleObjReducer = (state: BetTxState, newState: Partial<BetTxState>) => ({
  ...state,
  ...newState,
})

/**
 * Place a bet on outcomes (single or combo bet).
 * Handles token approval, EIP-712 signature, and transaction submission through the Azuro relayer.
 *
 * Supports both regular wallets and Account Abstraction (AA) wallets.
 * For AA wallets, approval is handled automatically within the bet transaction.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/write/useBet
 *
 * @example
 * import { useBet } from '@azuro-org/sdk'
 *
 * const { submit, approveTx, betTx, isApproveRequired } = useBet({
 *   betAmount: '10',
 *   slippage: 5,
 *   affiliate: '0x...',
 *   selections: [{ conditionId: '123', outcomeId: '1' }],
 *   odds: { '123-1': 1.5 },
 *   totalOdds: 1.5,
 *   onBetOrderCreated: (order) => console.log('Bet order created!', order),
 *   onSuccess: (receipt) => console.log('Bet placed to blockchain!', receipt),
 * })
 * */
export const useBet = (props: UseBetProps) => {
  const {
    betAmount, slippage, deadline, affiliate, selections, odds,
    totalOdds, chainId, freebet, EIP712Attention, onSuccess, onError, onBetOrderCreated,
  } = props

  const isCombo = selections.length > 1
  // const isBatch = isCombo && typeof _betAmount === 'object'
  const isFreeBet = Boolean(freebet)

  const account = useExtendedAccount()
  const isAAWallet = Boolean(account.isAAWallet)
  const aaClient = useAAWalletClient()

  const { chain: appChain, contracts, betToken, graphql } = useOptionalChain(chainId)
  const queryClient = useQueryClient()
  const wagmiConfig = useConfig()
  const walletClient = useWalletClient()
  const {
    data: betFeeData,
    isFetching: isRelayerFeeFetching,
  } = useBetFee()
  const { relayerFeeAmount: rawRelayerFeeAmount, formattedRelayerFeeAmount: relayerFeeAmount } = betFeeData || {}
  const { refetch: refetchBetTokenBalance } = useBetTokenBalance()
  const { refetch: refetchNativeBalance } = useNativeBalance()

  const [ betTx, setBetTx ] = useReducer(simpleObjReducer, { data: undefined, isPendingOrderPlacing: false, isPendingTransaction: false, orderId: undefined })

  const approveAddress = contracts.relayer.address

  const allowanceTx = useReadContract({
    chainId: appChain.id,
    address: betToken.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [
      account.address!,
      approveAddress!,
    ],
    query: {
      enabled: Boolean(account.address) && Boolean(approveAddress) && !isFreeBet,
    },
  })

  const approveTx = useWriteContract()
  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveTx.data,
    query: {
      enabled: Boolean(approveTx.data),
    },
  })

  // const betAmount = useMemo(() => {
  //   if (typeof _betAmount === 'string') {
  //     return +_betAmount
  //   }

  //   return Object.values(_betAmount).reduce((acc, amount) => acc + +amount, 0)
  // }, [ _betAmount ])

  const isApproveRequired = useMemo(() => {
    if (
      !betAmount
      || typeof allowanceTx?.data === 'undefined'
      || typeof relayerFeeAmount === 'undefined'
    ) {
      return false
    }

    const approveAmount: number = +betAmount + +relayerFeeAmount

    return allowanceTx.data < parseUnits(String(approveAmount), betToken.decimals)
  }, [ allowanceTx.data, relayerFeeAmount, betAmount ])

  const approve = async () => {
    const hash = await approveTx.writeContractAsync({
      address: betToken.address!,
      abi: erc20Abi,
      functionName: 'approve',
      args: [
        approveAddress!,
        maxUint256,
      ],
    })

    await waitForTransactionReceipt(wagmiConfig, {
      hash,
      chainId: appChain.id,
    })
    allowanceTx.refetch()
  }

  const betReceipt = useWaitForTransactionReceipt({
    hash: betTx.data,
    query: {
      enabled: Boolean(betTx.data),
    },
  })

  const placeBet = async () => {
    if (!totalOdds) {
      return
    }

    let txHash: Hex

    setBetTx({
      data: undefined,
      orderId: undefined,
      isPendingOrderPlacing: true,
      isPendingTransaction: false,
    })

    try {
      if (isAAWallet && aaClient) {
        await aaClient.switchChain({ id: appChain.id })
      }

      const fixedAmount = formatToFixed(betAmount, betToken.decimals)
      const rawAmount = parseUnits(fixedAmount, betToken.decimals)
      const expiresAt = Math.floor(Date.now() / 1000) + (deadline || DEFAULT_DEADLINE)
      const fixedMinOdds = calcMinOdds({ odds: totalOdds, slippage })
      const rawMinOdds = parseUnits(fixedMinOdds, ODDS_DECIMALS)
      const { conditionId, outcomeId } = selections[0]!

      if (isAAWallet && isApproveRequired) {
        const hash = await aaClient!.sendTransaction({
          to: betToken.address!,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [
              approveAddress!,
              maxUint256,
            ],
          }),
        })

        await waitForTransactionReceipt(wagmiConfig, {
          hash,
          chainId: appChain.id,
          confirmations: 1,
        })
      }

      const clientData: BetClientData = {
        attention: EIP712Attention || 'By signing this transaction, I agree to place a bet for an event on Azuro Protocol',
        affiliate,
        core: contracts.core.address,
        expiresAt,
        chainId: appChain.id,
        relayerFeeAmount: String(rawRelayerFeeAmount),
        isBetSponsored: freebet?.params?.isBetSponsored || false,
        isFeeSponsored: freebet?.params?.isFeeSponsored || false,
        isSponsoredBetReturnable: freebet?.params?.isSponsoredBetReturnable || false,
      }

      let createdOrder: CreateBetResult | null

      if (isCombo) {
        const betData = {
          account: account.address!,
          clientData,
          amount: rawAmount,
          minOdds: rawMinOdds,
          nonce: String(Date.now()),
          bets: selections,
        }

        const typedData = getComboBetTypedData(betData)

        const signature = isAAWallet
          ? await aaClient!.signTypedData({ ...typedData, account: aaClient!.account as any })
          : await walletClient!.data!.signTypedData(typedData)


        createdOrder = await createComboBet({
          ...betData,
          bonusId: freebet?.id,
          signature,
        })
      }
      else {
        const betData = {
          account: account.address!,
          clientData,
          bet: {
            conditionId,
            outcomeId,
            amount: rawAmount,
            minOdds: rawMinOdds,
            nonce: String(Date.now()),
          },
        }

        const typedData = getBetTypedData(betData)

        const signature = isAAWallet
          ? await aaClient!.signTypedData({ ...typedData, account: aaClient!.account as any })
          : await walletClient!.data!.signTypedData(typedData)


        createdOrder = await createBet({
          ...betData,
          bonusId: freebet?.id,
          signature,
        })
      }

      const {
        id: orderId,
        state: newOrderState,
        errorMessage,
        error: errorCode,
      } = createdOrder!

      const accountLowerCased = account?.address?.toLowerCase()

      if (newOrderState === BetOrderState.Created) {
        setBetTx({
          orderId,
          isPendingOrderPlacing: false,
          isPendingTransaction: true,
        })

        queryClient.invalidateQueries({
          predicate: ({ queryKey }) => (
            queryKey[0] === 'bets' &&
            queryKey[1] === appChain.id &&
            queryKey[2] === accountLowerCased &&
            (!queryKey[3] || queryKey[3] === BetType.Accepted || queryKey[3] === BetType.Pending)
          )
        })

        onBetOrderCreated?.(createdOrder)

        txHash = await new Promise<Hex>((res, rej) => {
          const interval = setInterval(async () => {
            const order = await getBet({
              chainId: appChain.id,
              orderId,
            })

            const { state, txHash, errorMessage, error } = order!

            if (state === BetOrderState.Rejected || state === BetOrderState.Canceled) {
              clearInterval(interval)
              rej(new BetOrderError(errorMessage || state, {
                orderId,
                orderState: state,
                errorCode: error,
              }))
            }

            if (txHash) {
              clearInterval(interval)
              res(txHash as Hex)
            }
          }, 1000)
        })

        setBetTx({
          data: txHash,
          orderId,
          isPendingOrderPlacing: false,
          isPendingTransaction: false,
        })
      }
      else {
        throw new BetOrderError(errorMessage || 'An error occured during placing a bet', {
          orderId,
          orderState: newOrderState,
          errorCode,
        })
      }


      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: txHash!,
        chainId: appChain.id,
      })

      if (receipt?.status === 'reverted') {
        throw new BetOrderError(`transaction ${receipt.transactionHash} was reverted`, {
          orderId,
          orderState: newOrderState,
          errorCode: receipt?.status,
        })
      }

      refetchBetTokenBalance()
      refetchNativeBalance()
      allowanceTx.refetch()

      if (isFreeBet) {
        queryClient.invalidateQueries({
          queryKey: [ 'available-freebets', appChain.id, accountLowerCased, affiliate?.toLowerCase() ],
        })
        queryClient.invalidateQueries({
          queryKey: [ 'bonuses', appChain.id, accountLowerCased, affiliate?.toLowerCase() ],
        })
      }

      queryClient.invalidateQueries({
        predicate: ({ queryKey }) => (
          queryKey[0] === 'bets' &&
          queryKey[1] === appChain.id &&
          queryKey[2] === accountLowerCased &&
          (!queryKey[3] || queryKey[3] === BetType.Accepted || queryKey[3] === BetType.Pending)
        )
      })

      queryClient.invalidateQueries({
        queryKey: [ 'bets-summary', graphql.bets, accountLowerCased ],
      })

      onSuccess?.(receipt)
    }
    catch (err) {
      setBetTx({
        data: undefined,
        orderId: undefined,
        isPendingTransaction: false,
        isPendingOrderPlacing: false,
      })

      onError?.(err as any)
    }
  }

  const submit = () => {
    if (isApproveRequired && !isAAWallet) {
      return approve()
    }

    return placeBet()
  }

  return {
    submit,
    approveTx: {
      isPending: approveTx.isPending,
      isProcessing: approveReceipt.isLoading,
    },
    betTx: {
      data: betTx.data,
      orderId: betTx.orderId,
      receipt: betReceipt.data,
      isPending: betTx.isPendingOrderPlacing || betTx.isPendingTransaction,
      isSubmittingOrder: betTx.isPendingOrderPlacing,
      isProcessing: betReceipt.isLoading,
    },
    relayerFeeAmount,
    isAllowanceLoading: allowanceTx.isLoading,
    isApproveRequired: isAAWallet ? false : isApproveRequired,
    isRelayerFeeLoading: isRelayerFeeFetching,
  }
}
