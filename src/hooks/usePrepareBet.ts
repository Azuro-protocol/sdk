import { erc20ABI, useAccount, useContractRead, useContractWrite, useWaitForTransaction, usePublicClient, type Address } from 'wagmi'
import type { TransactionReceipt, Hex } from 'viem'
import { parseUnits, encodeAbiParameters, parseAbiParameters, keccak256, toBytes, createWalletClient, custom } from 'viem'
import axios from 'axios'

import { useChain } from '../contexts/chain'
import { DEFAULT_DEADLINE, ODDS_DECIMALS, MAX_UINT_256, liveCoreAddress, getApiUrl } from '../config'
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
  amount: string
  slippage: number
  affiliate: Address
  selections: Selection[]
  selectionsOdds: Record<string, number>
  totalOdds: number
  deadline?: number
  onSuccess?(receipt: TransactionReceipt): void
  onError?(err?: Error): void
}

export const usePrepareBet = (props: Props) => {
  const { amount, slippage, deadline, affiliate, selections, selectionsOdds, totalOdds, onSuccess, onError } = props

  const account = useAccount()
  const publicClient = usePublicClient()
  const { appChain, contracts, betToken } = useChain()
  const { addBet } = useBetsCache()

  const isLiveBet = selections.some(({ coreAddress }) => coreAddress === liveCoreAddress)

  const approveAddress = isLiveBet ? contracts.liveRelayer!.address : contracts.proxyFront.address

  const allowanceTx = useContractRead({
    chainId: appChain.id,
    address: betToken.address,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [
      account.address!,
      approveAddress,
    ],
    enabled: Boolean(account.address),
  })

  const approveTx = useContractWrite({
    address: betToken.address,
    abi: erc20ABI,
    functionName: 'approve',
    args: [
      approveAddress,
      MAX_UINT_256,
    ],
  })

  const approveReceipt = useWaitForTransaction(approveTx.data)

  const isApproveRequired = Boolean(
    allowanceTx.data !== undefined
    && +amount
    && allowanceTx.data < parseUnits(isLiveBet ? String((+amount + Live_BET_GAS)) : amount, betToken.decimals)
  )

  const approve = async () => {
    const tx = await approveTx.writeAsync()
    await publicClient.waitForTransactionReceipt(tx)
    allowanceTx.refetch()
  }

  const betTx = useContractWrite({
    address: contracts.proxyFront.address,
    abi: contracts.proxyFront.abi,
    functionName: 'bet',
    value: BigInt(0),
  })

  const betReceipt = useWaitForTransaction(betTx.data)

  const placeBet = async () => {
    if (!totalOdds) {
      return
    }

    const fixedAmount = +parseFloat(String(amount)).toFixed(betToken.decimals)
    const rawAmount = parseUnits(`${fixedAmount}`, betToken.decimals)

    const minOdds = 1 + (+totalOdds - 1) * (100 - slippage) / 100
    const fixedMinOdds = +parseFloat(String(minOdds)).toFixed(ODDS_DECIMALS)
    const rawMinOdds = parseUnits(`${fixedMinOdds}`, ODDS_DECIMALS)
    const rawDeadline = BigInt(Math.floor(Date.now() / 1000) + (deadline || DEFAULT_DEADLINE))

    let txHash: Hex

    try {
      if (isLiveBet) {
        const { conditionId, outcomeId } = selections[0]!

        let signature: Hex

        const bet = {
          affiliate,
          amount: String(rawAmount),
          chainId: appChain.id,
          conditionId: conditionId,
          outcomeId: +outcomeId,
          minPrice: String(rawMinOdds),
          nonce: Date.now(),
          expiresAt: Math.floor(Date.now() / 1000) + 2000,
          maxFee: String(parseUnits(String(Live_BET_GAS), betToken.decimals)),
        }

        const message = toBytes(keccak256(encodeAbiParameters([
          { name: 'affiliate', type: 'address' },
          { name: 'amount', type: 'uint128' },
          { name: 'chainId', type: 'uint256' },
          { name: 'conditionId', type: 'uint256' },
          { name: 'outcomeId', type: 'uint64' },
          { name: 'minPrice', type: 'uint64' },
          { name: 'nonce', type: 'uint256' },
          { name: 'expiresAt', type: 'uint256' },
          { name: 'maxFee', type: 'uint256' },
        ] as const, [
          bet.affiliate,
          BigInt(bet.amount),
          BigInt(bet.chainId),
          BigInt(bet.conditionId),
          BigInt(bet.outcomeId),
          BigInt(bet.minPrice),
          BigInt(bet.nonce),
          BigInt(bet.expiresAt),
          BigInt(bet.maxFee),
        ])))

        // signMessage from wagmi doesn't allow array of bytes
        // but for contract we have to use toBytes function for message
        const walletClient = createWalletClient({
          account: account.address,
          transport: custom((window as any).ethereum),
        })

        signature = await walletClient.signMessage({
          account: account.address!,
          message: {
            raw: message,
          },
        })

        const signedBet = {
          environment: 'PolygonMumbaiUSDT', // ATTN create getProviderEnvironment function
          bettor: account.address!.toLowerCase(),
          data: bet,
          bettorSignature: signature,
        }

        const apiUrl = getApiUrl(appChain.id)

        const {
          data: { id: orderId, state: newOrderState, errorMessage },
        } = await axios.post<LiveCreateOrderResponse>(`${apiUrl}/orders`, signedBet)

        if (newOrderState === LiveOrderState.Created) {
          txHash = await new Promise<Hex>((res, rej) => {
            const interval = setInterval(async () => {
              const {
                data: { state, txHash, price, betId: tokenId },
              } = await axios.get<LiveGetOrderResponse>(`${apiUrl}/orders/${orderId}`)

              if (state === LiveOrderState.Rejected) {
                clearInterval(interval)
                rej()
              }

              if (txHash) {
                clearInterval(interval)

                // betId = tokenId
                // const finalOdds = formatUnits(BigInt(price), constants.decimals.oddsV2)
                // const potentialPayout = +finalOdds * +betAmount
                // const shouldOpenCollateralModal = !localStorage.getItem(constants.localStorage.wasCollateralModalShown)

                // modifyLiveCache({
                //   account,
                //   txHash,
                //   bet: {
                //     betId,
                //     coreAddress: items[0].coreAddress,
                //     lpAddress: items[0].lpAddress,
                //     odds: finalOdds,
                //     amount: betAmount,
                //     potentialPayout: +finalOdds * +betAmount,
                //     betTokenSymbol,
                //     outcomes: items.map(({ outcomeId, conditionId, conditionEntityId, game, odds }) => ({
                //       odds,
                //       outcomeId,
                //       conditionId,
                //       conditionEntityId,
                //       gameEntityId: game.gameId,
                //     })),
                //   },
                // })
                res(txHash as Hex)
              }
            }, 1000)
          })
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

        const tx = await betTx.writeAsync({
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

        txHash = tx.hash
      }

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash!,
      })

      allowanceTx.refetch()

      if (!isLiveBet) {
        addBet({
          receipt,
          bet: {
            amount: `${fixedAmount}`,
            selections,
            selectionsOdds: selectionsOdds!,
          },
        })
      }

      if (onSuccess) {
        onSuccess(receipt)
      }
    }
    catch (err) {
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
    totalOdds,
    submit,
    approveTx: {
      isPending: approveTx.isLoading,
      isProcessing: approveReceipt.isLoading,
      data: approveTx.data,
      error: approveTx.error,
    },
    betTx: {
      isPending: betTx.isLoading,
      isProcessing: betReceipt.isLoading,
      isSuccess: betReceipt.isSuccess,
      data: betTx.data,
      error: betTx.error,
    },
  }
}
