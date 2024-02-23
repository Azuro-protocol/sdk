import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient } from 'wagmi'
import {
  parseUnits,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
  toBytes,
  type Address, erc20Abi, type TransactionReceipt, type Hex } from 'viem'
import { useState } from 'react'

import { useChain } from '../contexts/chain'
import { DEFAULT_DEADLINE, ODDS_DECIMALS, MAX_UINT_256, liveHostAddress, getApiUrl, liveCoreAddress } from '../config'
import type { Selection } from '../global'
import { useBetsCache } from './useBetsCache'


const Live_BET_GAS = 0.01

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
  price: string
  betId: string
} & LiveCreateOrderResponse

type Props = {
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

export const usePrepareBet = (props: Props) => {
  const { betAmount, slippage, deadline, affiliate, selections, odds, totalOdds, onSuccess, onError } = props

  const account = useAccount()
  const publicClient = usePublicClient()
  const walletClient = useWalletClient()
  const { appChain, contracts, betToken } = useChain()
  const { addBet } = useBetsCache()
  const [ isLiveBetPending, setLiveBetPending ] = useState(false)
  const [ isLiveBetProcessing, setLiveBetProcessing ] = useState(false)

  const isLiveBet = selections.some(({ coreAddress }) => coreAddress === liveHostAddress)

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
      enabled: Boolean(account.address) && Boolean(approveAddress),
    },
  })

  const approveTx = useWriteContract()

  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveTx.data,
  })

  const isApproveRequired = Boolean(
    allowanceTx.data !== undefined
    && +betAmount
    && allowanceTx.data < parseUnits(isLiveBet ? String((+betAmount + Live_BET_GAS)) : betAmount, betToken.decimals)
  )

  const approve = async () => {
    const hash = await approveTx.writeContractAsync({
      address: betToken.address!,
      abi: erc20Abi,
      functionName: 'approve',
      args: [
        contracts.proxyFront.address,
        MAX_UINT_256,
      ],
    })
    await publicClient!.waitForTransactionReceipt({
      hash,
    })
    allowanceTx.refetch()
  }

  const betTx = useWriteContract()

  const betReceipt = useWaitForTransactionReceipt({
    hash: betTx.data,
  })

  const placeBet = async () => {
    if (!totalOdds) {
      return
    }

    const fixedAmount = +parseFloat(String(betAmount)).toFixed(betToken.decimals)
    const rawAmount = parseUnits(`${fixedAmount}`, betToken.decimals)

    const minOdds = 1 + (+totalOdds - 1) * (100 - slippage) / 100
    const fixedMinOdds = +parseFloat(String(minOdds)).toFixed(ODDS_DECIMALS)
    const rawMinOdds = parseUnits(`${fixedMinOdds}`, ODDS_DECIMALS)
    const rawDeadline = BigInt(Math.floor(Date.now() / 1000) + (deadline || DEFAULT_DEADLINE))

    let txHash: Hex

    try {
      if (isLiveBet) {
        setLiveBetPending(true)
        const { conditionId, outcomeId } = selections[0]!

        let signature: Hex

        const order = {
          affiliate,
          bet: {
            core: liveCoreAddress as Address,
            amount: String(rawAmount),
            chainId: appChain.id,
            conditionId: conditionId,
            outcomeId: +outcomeId,
            minPrice: String(rawMinOdds),
            nonce: String(Date.now()),
            expiresAt: Math.floor(Date.now() / 1000) + 2000,
            maxFee: String(parseUnits(String(Live_BET_GAS), betToken.decimals)),
          },
        }

        const abi = [
          { name: 'affiliate', type: 'address' },
          {
            name: 'bet', type: 'tuple',
            components: [
              { name: 'core', type: 'address' },
              { name: 'amount', type: 'uint128' },
              { name: 'nonce', type: 'uint256' },
              { name: 'conditionId', type: 'uint256' },
              { name: 'outcomeId', type: 'uint64' },
              { name: 'minOdds', type: 'uint64' },
              { name: 'expiredAt', type: 'uint256' },
              { name: 'chainId', type: 'uint256' },
              { name: 'relayerFeeAmount', type: 'uint256' },
            ],
          },
        ] as const

        const message = toBytes(keccak256(encodeAbiParameters(
          abi,
          [
            order.affiliate,
            {
              core: order.bet.core,
              amount: BigInt(order.bet.amount),
              nonce: BigInt(order.bet.nonce),
              conditionId: BigInt(order.bet.conditionId),
              outcomeId: BigInt(order.bet.outcomeId),
              minOdds: BigInt(order.bet.minPrice),
              expiredAt: BigInt(order.bet.expiresAt),
              chainId: BigInt(order.bet.chainId),
              relayerFeeAmount: BigInt(order.bet.maxFee),
            },
          ]
        )))

        signature = await walletClient!.data!.signMessage({
          account: account.address,
          message: {
            raw: message,
          },
        })
        setLiveBetPending(false)
        setLiveBetProcessing(true)

        const signedBet = {
          environment: 'PolygonMumbaiAZUSD', // ATTN create getProviderEnvironment function
          bettor: account.address!.toLowerCase(),
          data: order,
          bettorSignature: signature,
        }

        const apiUrl = getApiUrl(appChain.id)

        const createOrderResponse = await fetch(`${apiUrl}/orders`, {
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
              const getOrderResponse = await fetch(`${apiUrl}/orders/${orderId}`)
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
          setLiveBetProcessing(false)
        }
        else {
          throw Error(errorMessage)
        }
      }
      else {
        let coreAddress: Address
        let data: Address

        if (selections.length > 1) {
          coreAddress = contracts.prematchComboCore.address

          const tuple: [ bigint, bigint ][] = selections.map(({ conditionId, outcomeId }) => [
            BigInt(conditionId),
            BigInt(outcomeId),
          ])

          data = encodeAbiParameters(
            parseAbiParameters('(uint256, uint64)[]'),
            [
              tuple,
            ]
          )
        }
        else {
          coreAddress = contracts.prematchCore.address

          const { conditionId, outcomeId } = selections[0]!

          data = encodeAbiParameters(
            parseAbiParameters('uint256, uint64'),
            [
              BigInt(conditionId),
              BigInt(outcomeId),
            ]
          )
        }
        txHash = await betTx.writeContractAsync({
          address: contracts.proxyFront.address,
          abi: contracts.proxyFront.abi,
          functionName: 'bet',
          value: BigInt(0),
          args: [
            contracts.lp.address,
            [
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
            ],
          ],
        })
      }

      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: txHash,
      })

      if (receipt) {
        addBet({
          receipt,
          bet: {
            amount: `${fixedAmount}`,
            selections,
            odds,
          },
        })
      }

      if (onSuccess) {
        onSuccess(receipt)
      }
    }
    catch (err) {
      setLiveBetPending(false)
      setLiveBetProcessing(false)

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
    isAllowanceLoading: allowanceTx.isLoading,
    isApproveRequired,
    submit,
    approveTx: {
      isPending: approveTx.isPending,
      isProcessing: approveReceipt.isLoading,
    },
    betTx: {
      isPending: betTx.isPending || isLiveBetPending,
      isProcessing: betReceipt.isLoading || isLiveBetProcessing,
    },
  }
}
