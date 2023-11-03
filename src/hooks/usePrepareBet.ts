import { erc20ABI, useAccount, useContractRead, useContractWrite, useWaitForTransaction, usePublicClient, type Address } from 'wagmi'
import { parseUnits, formatUnits, encodeAbiParameters, parseAbiParameters, TransactionReceipt } from 'viem'
import { useChain } from '../contexts/chain'
import { DEFAULT_DEADLINE, ODDS_DECIMALS, MAX_UINT_256 } from '../config'
import { useCalcOdds } from './useCalcOdds'
import { Selection } from '../global';


type Props = {
  amount: string
  slippage: number
  affiliate: Address
  selections: Selection[]
  deadline?: number
  onSuccess?(receipt: TransactionReceipt): void
  onError?(err?: Error): void
}

export const usePrepareBet = (props: Props) => {
  const { amount, slippage, deadline, affiliate, selections, onSuccess, onError } = props

  const account = useAccount()
  const publicClient = usePublicClient()
  const { appChain, contracts, betToken } = useChain()

  const allowanceTx = useContractRead({
    chainId: appChain.id,
    address: betToken.address,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [
      account.address!,
      contracts.proxyFront.address,
    ],
    enabled: Boolean(account.address),
  })

  const approveTx = useContractWrite({
    address: betToken.address,
    abi: erc20ABI,
    functionName: 'approve',
    args: [
      contracts.proxyFront.address,
      MAX_UINT_256,
    ],
  })

  const approveReceipt = useWaitForTransaction(approveTx.data)

  const isApproveRequired = Boolean(
    allowanceTx.data !== undefined
    && +amount
    && allowanceTx.data < parseUnits(amount, betToken.decimals)
  )

  const approve = async () => {
    const tx = await approveTx.writeAsync()
    await publicClient.waitForTransactionReceipt(tx)
    allowanceTx.refetch()
  }

  const { isLoading: isOddsLoading, data: oddsData } = useCalcOdds({
    selections,
    amount,
  })

  const conditionsOdds = oddsData.conditionsOdds?.map((rawOdds) => {
    return +formatUnits(rawOdds, ODDS_DECIMALS)
  })

  const totalOdds = oddsData.totalOdds ? +formatUnits(oddsData.totalOdds, ODDS_DECIMALS) : undefined

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

    const minOdds = 1 + (totalOdds - 1) * (100 - slippage) / 100
    const fixedMinOdds = +parseFloat(String(minOdds)).toFixed(ODDS_DECIMALS)
    const rawMinOdds = parseUnits(`${fixedMinOdds}`, ODDS_DECIMALS)
    const rawDeadline = BigInt(Math.floor(Date.now() / 1000) + (deadline || DEFAULT_DEADLINE))

    let coreAddress: `0x${string}`
    let data: `0x${string}`

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
        ],
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

    try {
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
          ]
        ],
      })
  
      const receipt = await publicClient.waitForTransactionReceipt(tx)

      if (onSuccess) {
        onSuccess(receipt)
      }
    } catch (err) {
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
    isOddsLoading,
    conditionsOdds,
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
