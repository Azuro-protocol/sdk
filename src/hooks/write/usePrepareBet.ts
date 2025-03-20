import {
  useReadContract, useWriteContract, useSendTransaction,
  useWaitForTransactionReceipt, useWalletClient, useConfig,
} from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import {
  parseUnits, maxUint256, encodeFunctionData,
  type Address, erc20Abi, type TransactionReceipt, type Hex,
  type SendTransactionParameters,
} from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useReducer } from 'react'
import {
  type Selection, ODDS_DECIMALS, liveHostAddress, LiveBetState,
  calcMindOdds, freeBetAbi, getPrematchBetDataBytes,
  getLiveBetTypedData,
  createLiveBet,
  getLiveBet,
} from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'
import { DEFAULT_DEADLINE } from '../../config'
import { formatToFixed } from '../../helpers/formatToFixed'
import { useBetsCache, type NewBetProps } from '../useBetsCache'
import { useLiveBetFee } from '../data/useLiveBetFee'
import { type FreeBet } from '../data/useFreeBets'
import { useAAWalletClient, useExtendedAccount } from '../useAaConnector'
import { useBetTokenBalance } from '../useBetTokenBalance'
import { useNativeBalance } from '../useNativeBalance'


type Props = {
  betAmount: string | Record<string, string>
  slippage: number
  affiliate: Address
  selections: Selection[]
  odds: Record<string, number>
  totalOdds: number
  freeBet?: FreeBet
  betGas?: Pick<SendTransactionParameters, 'gas' | 'gasPrice' | 'maxFeePerGas' | 'maxFeePerBlobGas' | 'maxPriorityFeePerGas'>
  liveEIP712Attention?: string
  deadline?: number
  onSuccess?(receipt?: TransactionReceipt): void
  onError?(err?: Error): void
}

type LiveBetTxState = {
  isPending: boolean
  data: Hex | undefined
}

const simpleObjReducer = (state: LiveBetTxState, newState: Partial<LiveBetTxState>) => ({
  ...state,
  ...newState,
})

export const usePrepareBet = (props: Props) => {
  const {
    betAmount: _betAmount, slippage, deadline, affiliate, selections, odds,
    totalOdds, freeBet, betGas, liveEIP712Attention, onSuccess, onError,
  } = props

  const isLiveBet = true
  const isCombo = !isLiveBet && selections.length > 1
  const isBatch = isCombo && typeof _betAmount === 'object'
  const isFreeBet = Boolean(freeBet) && !isCombo && !isBatch

  const account = useExtendedAccount()
  const isAAWallet = Boolean(account.isAAWallet)
  const aaClient = useAAWalletClient()

  const { appChain, contracts, betToken, api } = useChain()
  const queryClient = useQueryClient()
  const wagmiConfig = useConfig()
  const walletClient = useWalletClient()
  const {
    data: liveBetFeeData,
    isFetching: isRelayerFeeFetching,
  } = useLiveBetFee({
    enabled: isLiveBet,
  })
  const { relayerFeeAmount: rawRelayerFeeAmount, formattedRelayerFeeAmount: relayerFeeAmount } = liveBetFeeData || {}
  const { addBet } = useBetsCache()
  const { refetch: refetchBetTokenBalance } = useBetTokenBalance()
  const { refetch: refetchNativeBalance } = useNativeBalance()

  const [ liveOrAABetTx, updateLiveOrAABetTx ] = useReducer(simpleObjReducer, { data: undefined, isPending: false })

  const approveAddress = isLiveBet ? contracts.liveRelayer?.address : contracts.proxyFront.address

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

  const betAmount = useMemo(() => {
    if (typeof _betAmount === 'string') {
      return +_betAmount
    }

    return Object.values(_betAmount).reduce((acc, amount) => acc + +amount, 0)
  }, [ _betAmount ])

  const isApproveRequired = useMemo(() => {
    if (
      !betAmount
      || typeof allowanceTx?.data === 'undefined'
      || (isLiveBet && typeof relayerFeeAmount === 'undefined')
    ) {
      return false
    }

    let approveAmount = betAmount

    if (isLiveBet) {
      approveAmount += +relayerFeeAmount!
    }

    return allowanceTx.data < parseUnits(String(approveAmount), betToken.decimals)
  }, [ allowanceTx.data, isLiveBet, relayerFeeAmount, betAmount ])

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

  const betTx = useSendTransaction()

  const betReceipt = useWaitForTransactionReceipt({
    hash: betTx.data || liveOrAABetTx.data,
    query: {
      enabled: Boolean(betTx.data) || Boolean(liveOrAABetTx.data),
    },
  })

  const placeBet = async () => {
    if (!totalOdds) {
      return
    }

    let bets: NewBetProps['bet'][] = []

    const fixedAmount = formatToFixed(betAmount, betToken.decimals)
    const rawAmount = parseUnits(fixedAmount, betToken.decimals)
    const rawDeadline = BigInt(Math.floor(Date.now() / 1000) + (deadline || DEFAULT_DEADLINE))

    let txHash: Hex

    betTx.reset()
    updateLiveOrAABetTx({
      data: undefined,
      isPending: isLiveBet || isAAWallet,
    })

    if (isAAWallet && aaClient) {
      await aaClient.switchChain({ id: appChain.id })
    }

    try {
      if (isLiveBet) {
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

        const liveBet = {
          attention: liveEIP712Attention || 'By signing this transaction, I agree to place a bet for a live event on \'Azuro SDK Example',
          affiliate,
          core: contracts.liveCore!.address,
          amount: String(rawAmount),
          chainId: appChain.id,
          conditionId: conditionId,
          outcomeId: +outcomeId,
          minOdds: String(rawMinOdds),
          nonce: String(Date.now()),
          expiresAt: Math.floor(Date.now() / 1000) + 2000,
          relayerFeeAmount: String(rawRelayerFeeAmount),
        }

        const typedData = getLiveBetTypedData({
          account: account.address!,
          chainId: appChain.id,
          bet: liveBet,
        })

        const signature = isAAWallet
          ? await aaClient!.signTypedData({ ...typedData, account: aaClient!.account })
          : await walletClient!.data!.signTypedData(typedData)

        const createdOrder = await createLiveBet({
          account: account.address!,
          chainId: appChain.id,
          bet: liveBet,
          signature,
        })

        const {
          id: orderId,
          state: newOrderState,
          errorMessage,
        } = createdOrder!

        if (newOrderState === LiveBetState.Created) {
          txHash = await new Promise<Hex>((res, rej) => {
            const interval = setInterval(async () => {
              const order = await getLiveBet({
                chainId: appChain.id,
                orderId,
              })

              const { state, txHash, errorMessage } = order!

              if (state === LiveBetState.Rejected) {
                clearInterval(interval)
                rej(errorMessage)
              }

              if (txHash) {
                clearInterval(interval)
                res(txHash as Hex)
              }
            }, 1000)
          })

          updateLiveOrAABetTx({
            data: txHash,
            isPending: false,
          })
        }
        else {
          throw Error(errorMessage)
        }
      }
      else if (isFreeBet) {
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
        let betData

        if (isBatch) {
          betData = selections.map(selection => {
            const { conditionId, outcomeId } = selection

            const fixedAmount = parseFloat(_betAmount[`${conditionId}-${outcomeId}`]!).toFixed(betToken.decimals)
            const rawAmount = parseUnits(fixedAmount, betToken.decimals)
            const fixedMinOdds = calcMindOdds({ odds: odds[`${conditionId}-${outcomeId}`]!, slippage })
            const rawMinOdds = parseUnits(fixedMinOdds, ODDS_DECIMALS)
            const data = getPrematchBetDataBytes([ selection ])

            bets.push({
              rawAmount,
              selections: [ selection ],
            })

            return {
              core: contracts.prematchCore.address,
              amount: rawAmount,
              expiresAt: rawDeadline,
              extraData: {
                affiliate,
                minOdds: rawMinOdds,
                data,
              },
            }
          })
        }
        else {
          const fixedMinOdds = calcMindOdds({ odds: totalOdds, slippage })
          const rawMinOdds = parseUnits(fixedMinOdds, ODDS_DECIMALS)
          const coreAddress = selections.length > 1 ? contracts.prematchComboCore.address : contracts.prematchCore.address
          const data = getPrematchBetDataBytes(selections)

          bets.push({
            rawAmount,
            selections,
          })

          betData = [
            {
              core: coreAddress,
              amount: rawAmount,
              expiresAt: rawDeadline,
              extraData: {
                affiliate,
                minOdds: rawMinOdds,
                data,
              },
            },
          ]
        }

        const betTxDTO = {
          to: contracts.proxyFront.address,
          data: encodeFunctionData({
            abi: contracts.proxyFront.abi,
            functionName: 'bet',
            args: [
              contracts.lp.address,
              betData,
            ],
          }),
          ...(betGas || {}),
        }

        if (isAAWallet) {
          const calls = isApproveRequired ? [
            {
              to: betToken.address!,
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: 'approve',
                args: [
                  approveAddress!,
                  maxUint256,
                ],
              }),
            },
            betTxDTO,
          ] : [
            betTxDTO,
          ]

          txHash = await aaClient!.sendTransaction({
            calls,
          })

          updateLiveOrAABetTx({
            data: txHash,
            isPending: false,
          })
        }
        else {
          txHash = await betTx.sendTransactionAsync(betTxDTO)
        }
      }

      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: txHash!,
        chainId: appChain.id,
      })

      refetchBetTokenBalance()
      refetchNativeBalance()
      allowanceTx.refetch()

      if (isFreeBet) {
        const queryKey = [ 'freebets', api, account.address!.toLowerCase(), affiliate.toLowerCase() ]
        await queryClient.cancelQueries({ queryKey })

        queryClient.setQueryData(queryKey, (oldFreeBets: FreeBet[]) => {
          const newFreeBets = [ ...oldFreeBets ].filter(({ id, contractAddress }) => {
            return contractAddress.toLowerCase() !== freeBet!.contractAddress.toLowerCase() || id !== freeBet!.id
          })

          return newFreeBets
        })
      }

      if (receipt?.status === 'reverted') {
        betTx.reset()
        updateLiveOrAABetTx({
          data: undefined,
          isPending: false,
        })
        throw new Error(`transaction ${receipt.transactionHash} was reverted`)
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
      if (isLiveBet) {
        updateLiveOrAABetTx({
          isPending: false,
        })
      }

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
      data: betTx.data || liveOrAABetTx.data,
      receipt: betReceipt.data,
      isPending: betTx.isPending || liveOrAABetTx.isPending,
      isProcessing: betReceipt.isLoading,
    },
    relayerFeeAmount,
    isAllowanceLoading: allowanceTx.isLoading,
    isApproveRequired: isAAWallet ? false : isApproveRequired,
    isRelayerFeeLoading: isRelayerFeeFetching,
  }
}
