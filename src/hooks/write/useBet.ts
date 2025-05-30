import {
  useReadContract, useWriteContract,
  useWaitForTransactionReceipt, useWalletClient, useConfig,
} from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import {
  parseUnits, maxUint256, encodeFunctionData,
  type Address, erc20Abi, type TransactionReceipt, type Hex,
} from 'viem'
import { useMemo, useReducer } from 'react'
import {
  type Selection,
  type BetClientData,
  type CreateBetResponse,
  type Freebet,
  type ChainId,

  ODDS_DECIMALS,
  BetState,
  calcMindOdds,
  getBetTypedData,
  createBet,
  getBet,
  getComboBetTypedData,
  createComboBet,
} from '@azuro-org/toolkit'
import { useQueryClient } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { DEFAULT_DEADLINE } from '../../config'
import { formatToFixed } from '../../helpers/formatToFixed'
import { useBetsCache, type NewBetProps } from '../useBetsCache'
import { useBetFee } from '../data/useBetFee'
// import { type FreeBet } from '../data/useFreeBets'
import { useAAWalletClient, useExtendedAccount } from '../useAaConnector'
import { useBetTokenBalance } from '../useBetTokenBalance'
import { useNativeBalance } from '../useNativeBalance'


type UseBetProps = {
  // betAmount: string | Record<string, string>
  betAmount: string
  slippage: number
  affiliate: Address
  selections: Selection[]
  odds: Record<string, number>
  totalOdds: number
  chainId?: ChainId
  freebet?: Freebet
  EIP712Attention?: string
  deadline?: number
  onSuccess?(receipt?: TransactionReceipt): void
  onError?(err?: Error): void
}

type BetTxState = {
  isPending: boolean
  data: Hex | undefined
}

const simpleObjReducer = (state: BetTxState, newState: Partial<BetTxState>) => ({
  ...state,
  ...newState,
})

export const useBet = (props: UseBetProps) => {
  const {
    betAmount, slippage, deadline, affiliate, selections, odds,
    totalOdds, chainId, freebet, EIP712Attention, onSuccess, onError,
  } = props

  const isCombo = selections.length > 1
  // const isBatch = isCombo && typeof _betAmount === 'object'
  const isFreeBet = Boolean(freebet)

  const account = useExtendedAccount()
  const isAAWallet = Boolean(account.isAAWallet)
  const aaClient = useAAWalletClient()

  const { chain: appChain, contracts, betToken } = useOptionalChain(chainId)
  const queryClient = useQueryClient()
  const wagmiConfig = useConfig()
  const walletClient = useWalletClient()
  const {
    data: betFeeData,
    isFetching: isRelayerFeeFetching,
  } = useBetFee()
  const { relayerFeeAmount: rawRelayerFeeAmount, formattedRelayerFeeAmount: relayerFeeAmount } = betFeeData || {}
  const { addBet } = useBetsCache(appChain.id)
  const { refetch: refetchBetTokenBalance } = useBetTokenBalance()
  const { refetch: refetchNativeBalance } = useNativeBalance()

  const [ betTx, setBetTx ] = useReducer(simpleObjReducer, { data: undefined, isPending: false })

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

    const approveAmount = betAmount + +relayerFeeAmount!

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

    let bets: NewBetProps['bet'][] = []

    let txHash: Hex

    setBetTx({
      data: undefined,
      isPending: true,
    })

    try {
      if (isAAWallet && aaClient) {
        await aaClient.switchChain({ id: appChain.id })
      }

      const fixedAmount = formatToFixed(betAmount, betToken.decimals)
      const rawAmount = parseUnits(fixedAmount, betToken.decimals)
      const expiresAt = Math.floor(Date.now() / 1000) + (deadline || DEFAULT_DEADLINE)
      const fixedMinOdds = calcMindOdds({ odds: totalOdds, slippage })
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

      bets.push({
        rawAmount,
        selections,
        freebetId: freebet?.id,
        isFreebetAmountReturnable: freebet?.params?.isSponsoredBetReturnable,
      })

      const clientData: BetClientData = {
        attention: EIP712Attention || 'By signing this transaction, I agree to place a bet for a live event on \'Azuro SDK Example',
        affiliate,
        core: contracts.core.address,
        expiresAt,
        chainId: appChain.id,
        relayerFeeAmount: String(rawRelayerFeeAmount),
        isBetSponsored: freebet?.params?.isBetSponsored || false,
        isFeeSponsored: freebet?.params?.isFeeSponsored || false,
        isSponsoredBetReturnable: freebet?.params?.isSponsoredBetReturnable || false,
      }

      let createdOrder: CreateBetResponse | null

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
            conditionId: conditionId,
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
      } = createdOrder!

      if (newOrderState === BetState.Created) {
        txHash = await new Promise<Hex>((res, rej) => {
          const interval = setInterval(async () => {
            const order = await getBet({
              chainId: appChain.id,
              orderId,
            })

            const { state, txHash, errorMessage } = order!

            if (state === BetState.Rejected) {
              clearInterval(interval)
              rej(errorMessage)
            }

            if (txHash) {
              clearInterval(interval)
              res(txHash as Hex)
            }
          }, 1000)
        })

        setBetTx({
          data: txHash,
          isPending: false,
        })
      }
      else {
        throw Error(errorMessage)
      }


      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: txHash!,
        chainId: appChain.id,
      })

      if (receipt?.status === 'reverted') {
        setBetTx({
          data: undefined,
          isPending: false,
        })
        throw new Error(`transaction ${receipt.transactionHash} was reverted`)
      }

      refetchBetTokenBalance()
      refetchNativeBalance()
      allowanceTx.refetch()

      if (isFreeBet) {
        queryClient.invalidateQueries({
          queryKey: [ 'available-freebets', appChain.id, account?.address?.toLowerCase(), affiliate?.toLowerCase(), selections.map(({ conditionId, outcomeId }) => `${conditionId}/${outcomeId}`).join('-') ],
        })
        queryClient.invalidateQueries({ queryKey: [ 'bonuses', appChain.id, account?.address?.toLowerCase(), affiliate?.toLowerCase() ] })
      }

      if (receipt) {
        bets.forEach((bet) => {
          addBet({
            receipt,
            affiliate,
            odds,
            bet,
          })
        })
      }

      onSuccess?.(receipt)
    }
    catch (err) {
      setBetTx({
        isPending: false,
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
      receipt: betReceipt.data,
      isPending: betTx.isPending,
      isProcessing: betReceipt.isLoading,
    },
    relayerFeeAmount,
    isAllowanceLoading: allowanceTx.isLoading,
    isApproveRequired: isAAWallet ? false : isApproveRequired,
    isRelayerFeeLoading: isRelayerFeeFetching,
  }
}
