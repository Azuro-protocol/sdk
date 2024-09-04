import {
  useAccount, useReadContract, useWriteContract, useSendTransaction,
  useWaitForTransactionReceipt, usePublicClient, useWalletClient,
  useBalance,
} from 'wagmi'
import {
  parseUnits, maxUint256, encodeFunctionData,
  type Address, erc20Abi, type TransactionReceipt, type Hex, type TypedDataDomain,
  type SendTransactionParameters,
} from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useReducer } from 'react'
import {
  type Selection, ODDS_DECIMALS, liveHostAddress,
  calcMindOdds, freeBetAbi, getPrematchBetDataBytes,
} from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'
import { DEFAULT_DEADLINE } from '../../config'
import { useBetsCache, type NewBetProps } from '../useBetsCache'
import { useLiveBetFee } from '../data/useLiveBetFee'
import { type FreeBet } from '../data/useFreeBets'


enum LiveOrderState {
  Created = 'Created',
  Pending = 'Pending',
  Sent = 'Sent',
  Accepted = 'Accepted',
  Rejected = 'Rejected'
}

type LiveCreateOrderResponse = {
  id: string
  state: LiveOrderState
  errorMessage?: string
}

type LiveGetOrderResponse = {
  txHash: string
  odds: string
  betId: string
} & LiveCreateOrderResponse

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

  const isLiveBet = useMemo(() => {
    return selections.some(({ coreAddress }) => coreAddress === liveHostAddress)
  }, [ selections ])
  const isCombo = !isLiveBet && selections.length > 1
  const isBatch = isCombo && typeof _betAmount === 'object'
  const isFreeBet = Boolean(freeBet) && !isCombo && !isBatch

  const account = useAccount()
  const queryClient = useQueryClient()
  const publicClient = usePublicClient()
  const walletClient = useWalletClient()
  const { appChain, contracts, betToken, api, environment } = useChain()
  const {
    relayerFeeAmount: rawRelayerFeeAmount,
    formattedRelayerFeeAmount: relayerFeeAmount,
    loading: isRelayerFeeFetching,
  } = useLiveBetFee({
    enabled: isLiveBet,
  })
  const { addBet } = useBetsCache()
  const { queryKey: balanceQueryKey } = useBalance({
    chainId: appChain.id,
    address: account.address,
    token: betToken.address,
  })

  const [ liveBetTx, updateLiveBetTx ] = useReducer(simpleObjReducer, { data: undefined, isPending: false })

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
    await publicClient!.waitForTransactionReceipt({
      hash,
    })
    allowanceTx.refetch()
  }

  const betTx = useSendTransaction()

  const betReceipt = useWaitForTransactionReceipt({
    hash: betTx.data || liveBetTx.data,
  })

  const placeBet = async () => {
    if (!totalOdds) {
      return
    }

    let bets: NewBetProps['bet'][] = []

    const fixedAmount = parseFloat(String(betAmount)).toFixed(betToken.decimals)
    const rawAmount = parseUnits(fixedAmount, betToken.decimals)
    const rawDeadline = BigInt(Math.floor(Date.now() / 1000) + (deadline || DEFAULT_DEADLINE))

    let txHash: Hex

    if (isLiveBet) {
      betTx.reset()
    }

    updateLiveBetTx({
      data: undefined,
      isPending: isLiveBet,
    })

    try {
      if (isLiveBet) {
        const fixedMinOdds = calcMindOdds({ odds: totalOdds, slippage })
        const rawMinOdds = parseUnits(fixedMinOdds, ODDS_DECIMALS)
        const { conditionId, outcomeId } = selections[0]!

        bets.push({
          rawAmount,
          selections,
        })

        const order = {
          bet: {
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
          },
        }

        const EIP712Domain: TypedDataDomain = {
          name: 'Live Betting',
          version: '1.0.0',
          chainId: appChain.id,
          verifyingContract: contracts.liveCore!.address,
        }

        const clientBetDataTypes = {
          ClientBetData: [
            { name: 'attention', type: 'string' },
            { name: 'affiliate', type: 'address' },
            { name: 'core', type: 'address' },
            { name: 'amount', type: 'uint128' },
            { name: 'nonce', type: 'uint256' },
            { name: 'conditionId', type: 'uint256' },
            { name: 'outcomeId', type: 'uint64' },
            { name: 'minOdds', type: 'uint64' },
            { name: 'expiresAt', type: 'uint256' },
            { name: 'chainId', type: 'uint256' },
            { name: 'relayerFeeAmount', type: 'uint256' },
          ],
        } as const

        const signature = await walletClient!.data!.signTypedData({
          account: account.address,
          domain: EIP712Domain,
          primaryType: 'ClientBetData',
          types: clientBetDataTypes,
          message: {
            attention: order.bet.attention,
            affiliate: order.bet.affiliate,
            core: order.bet.core,
            amount: BigInt(order.bet.amount),
            nonce: BigInt(order.bet.nonce),
            conditionId: BigInt(order.bet.conditionId),
            outcomeId: BigInt(order.bet.outcomeId),
            minOdds: BigInt(order.bet.minOdds),
            expiresAt: BigInt(order.bet.expiresAt),
            chainId: BigInt(order.bet.chainId),
            relayerFeeAmount: BigInt(order.bet.relayerFeeAmount),
          },
        })

        const signedBet = {
          environment,
          bettor: account.address!.toLowerCase(),
          data: order,
          bettorSignature: signature,
        }

        const createOrderResponse = await fetch(`${api}/orders`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signedBet),
        })

        const {
          id: orderId,
          state: newOrderState,
          errorMessage,
        }: LiveCreateOrderResponse = await createOrderResponse.json()

        if (newOrderState === LiveOrderState.Created) {
          txHash = await new Promise<Hex>((res, rej) => {
            const interval = setInterval(async () => {
              const getOrderResponse = await fetch(`${api}/orders/${orderId}`)
              const { state, txHash }: LiveGetOrderResponse = await getOrderResponse.json()

              if (state === LiveOrderState.Rejected) {
                clearInterval(interval)
                rej()
              }

              if (txHash) {
                clearInterval(interval)
                res(txHash as Hex)
              }
            }, 1000)
          })

          updateLiveBetTx({
            data: txHash,
            isPending: false,
          })
        }
        else {
          throw Error(errorMessage)
        }
      }
      else if (isFreeBet) {
        const { coreAddress, conditionId, outcomeId } = selections[0]!
        const { id, expiresAt, contractAddress, rawMinOdds, rawAmount, signature, chainId } = freeBet!

        const fixedSelectionMinOdds = calcMindOdds({ odds: odds[`${conditionId}-${outcomeId}`]!, slippage })
        const rawSelectionMinOdds = parseUnits(fixedSelectionMinOdds, ODDS_DECIMALS)
        const rawFreeBetMinOdds = rawMinOdds > rawSelectionMinOdds ? rawMinOdds : rawSelectionMinOdds

        bets.push({
          rawAmount,
          selections,
          freebetContractAddress: contractAddress,
          freebetId: String(id),
        })

        txHash = await betTx.sendTransactionAsync({
          to: contractAddress,
          data: encodeFunctionData({
            abi: freeBetAbi,
            functionName: 'bet',
            args: [
              {
                chainId: BigInt(chainId),
                expiresAt: BigInt(Math.floor(expiresAt / 1000)),
                amount: rawAmount,
                freeBetId: BigInt(id),
                minOdds: rawMinOdds,
                owner: account.address!,
              },
              signature,
              coreAddress as Address,
              BigInt(conditionId),
              BigInt(outcomeId),
              rawDeadline,
              rawFreeBetMinOdds,
            ],
          }),
          ...(betGas || {}),
        })
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

        txHash = await betTx.sendTransactionAsync({
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
        })
      }

      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: txHash,
      })

      queryClient.invalidateQueries({ queryKey: balanceQueryKey })

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

      if (onSuccess) {
        onSuccess(receipt)
      }
    }
    catch (err) {
      if (isLiveBet) {
        updateLiveBetTx({
          isPending: false,
        })
      }

      if (onError) {
        onError(err as any)
      }
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
    approveTx: {
      isPending: approveTx.isPending,
      isProcessing: approveReceipt.isLoading,
    },
    betTx: {
      data: betTx.data || liveBetTx.data,
      isPending: betTx.isPending || liveBetTx.isPending,
      isProcessing: betReceipt.isLoading,
    },
    relayerFeeAmount,
    isAllowanceLoading: allowanceTx.isLoading,
    isApproveRequired,
    isRelayerFeeLoading: isRelayerFeeFetching,
  }
}
