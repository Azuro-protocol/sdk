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
  type Selection, type BetClientData, ODDS_DECIMALS, BetState,
  calcMindOdds,
  getBetTypedData,
  createBet,
  getBet,
  getComboBetTypedData,
  createComboBet,
  type CreateBetResponse,
} from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'
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
  // freeBet?: FreeBet // TODO
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
    totalOdds, EIP712Attention, onSuccess, onError,
  } = props

  const isCombo = selections.length > 1
  // const isBatch = isCombo && typeof _betAmount === 'object'
  // const isFreeBet = Boolean(freeBet) && !isCombo && !isBatch
  // const isFreeBet = Boolean(freeBet) && !isCombo
  const isFreeBet = false

  const account = useExtendedAccount()
  const isAAWallet = Boolean(account.isAAWallet)
  const aaClient = useAAWalletClient()

  const { appChain, contracts, betToken, api } = useChain()
  const wagmiConfig = useConfig()
  const walletClient = useWalletClient()
  const {
    data: betFeeData,
    isFetching: isRelayerFeeFetching,
  } = useBetFee()
  const { relayerFeeAmount: rawRelayerFeeAmount, formattedRelayerFeeAmount: relayerFeeAmount } = betFeeData || {}
  const { addBet } = useBetsCache()
  const { refetch: refetchBetTokenBalance } = useBetTokenBalance()
  const { refetch: refetchNativeBalance } = useNativeBalance()

  const [ betTx, setBetTx ] = useReducer(simpleObjReducer, { data: undefined, isPending: false })

  // const approveAddress = isLiveBet ? contracts.liveRelayer?.address : contracts.proxyFront.address
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

    if (isAAWallet && aaClient) {
      await aaClient.switchChain({ id: appChain.id })
    }

    try {
      if (isFreeBet) {
        // const { coreAddress, conditionId, outcomeId } = selections[0]!
        // const { id, expiresAt, contractAddress, rawMinOdds, rawAmount, signature, chainId } = freeBet!

        // const fixedSelectionMinOdds = calcMindOdds({ odds: odds[`${conditionId}-${outcomeId}`]!, slippage })
        // const rawSelectionMinOdds = parseUnits(fixedSelectionMinOdds, ODDS_DECIMALS)
        // const rawFreeBetMinOdds = rawMinOdds > rawSelectionMinOdds ? rawMinOdds : rawSelectionMinOdds

        // bets.push({
        //   rawAmount,
        //   selections,
        //   freebetContractAddress: contractAddress,
        //   freebetId: String(id),
        // })

        // const data = encodeFunctionData({
        //   abi: freeBetAbi,
        //   functionName: 'bet',
        //   args: [
        //     {
        //       chainId: BigInt(chainId),
        //       expiresAt: BigInt(Math.floor(expiresAt / 1000)),
        //       amount: rawAmount,
        //       freeBetId: BigInt(id),
        //       minOdds: rawMinOdds,
        //       owner: account.address!,
        //     },
        //     signature,
        //     coreAddress as Address,
        //     BigInt(conditionId),
        //     BigInt(outcomeId),
        //     rawDeadline,
        //     rawFreeBetMinOdds,
        //   ],
        // })

        // txHash = isAAWallet ? (
        //   await aaClient!.sendTransaction({ to: contractAddress, data, chain: appChain })
        // ) : (
        //   await betTx.sendTransactionAsync({
        //     to: contractAddress,
        //     data,
        //     ...(betGas || {}),
        //   })
        // )
      }
      else {
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
        })

        const clientData: BetClientData = {
          attention: EIP712Attention || 'By signing this transaction, I agree to place a bet for a live event on \'Azuro SDK Example',
          affiliate,
          core: contracts.core.address,
          expiresAt,
          chainId: appChain.id,
          relayerFeeAmount: String(rawRelayerFeeAmount),
          isBetSponsored: false,
          isFeeSponsored: false,
          isSponsoredBetReturnable: false,
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
            ? await aaClient!.signTypedData({ ...typedData, account: aaClient!.account })
            : await walletClient!.data!.signTypedData(typedData)


          createdOrder = await createComboBet({
            ...betData,
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
            ? await aaClient!.signTypedData({ ...typedData, account: aaClient!.account })
            : await walletClient!.data!.signTypedData(typedData)


          createdOrder = await createBet({
            ...betData,
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
        // const queryKey = [ 'freebets', api, account.address!.toLowerCase(), affiliate.toLowerCase() ]
        // await queryClient.cancelQueries({ queryKey })

        // queryClient.setQueryData(queryKey, (oldFreeBets: FreeBet[]) => {
        //   const newFreeBets = [ ...oldFreeBets ].filter(({ id, contractAddress }) => {
        //     return contractAddress.toLowerCase() !== freeBet!.contractAddress.toLowerCase() || id !== freeBet!.id
        //   })

        //   return newFreeBets
        // })
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
