import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { parseUnits, formatUnits, encodeAbiParameters, parseAbiParameters, TransactionReceipt, type Address, erc20Abi } from 'viem'
import { useChain } from '../contexts/chain'
import { DEFAULT_DEADLINE, ODDS_DECIMALS, MAX_UINT_256 } from '../config'
import { useCalcOdds } from './useCalcOdds'
import { Selection } from '../global';
import { useBetsCache } from './useBetsCache';


type Props = {
  amount: string
  slippage: number
  affiliate: Address
  selections: Selection[]
  deadline?: number
  onSuccess?(receipt?: TransactionReceipt): void
  onError?(err?: Error): void
}

export const usePrepareBet = (props: Props) => {
  const { amount, slippage, deadline, affiliate, selections, onSuccess, onError } = props

  const account = useAccount()
  const publicClient = usePublicClient()
  const { appChain, contracts, betToken } = useChain()
  const { addBet } = useBetsCache()

  const allowanceTx = useReadContract({
    chainId: appChain.id,
    address: betToken.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [
      account.address!,
      contracts.proxyFront.address,
    ],
    query: {
      enabled: Boolean(account.address),
    }
  })

  const approveTx = useWriteContract()
  
  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveTx.data
  })

  const isApproveRequired = Boolean(
    allowanceTx.data !== undefined
    && +amount
    && allowanceTx.data < parseUnits(amount, betToken.decimals)
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
      hash
    })
    allowanceTx.refetch()
  }

  const { loading: isOddsLoading, data: oddsData } = useCalcOdds({
    selections,
    amount,
  })

  const selectionsOdds = oddsData.selectionsOdds?.map((rawOdds) => {
    return formatUnits(rawOdds, ODDS_DECIMALS)
  })

  const totalOdds = oddsData.totalOdds ? formatUnits(oddsData.totalOdds, ODDS_DECIMALS) : undefined

  const betTx = useWriteContract()

  const betReceipt = useWaitForTransactionReceipt({
    hash: betTx.data,
  })

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
      const hash = await betTx.writeContractAsync({
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
          ]
        ],
      })

      const receipt = await publicClient?.waitForTransactionReceipt({
        hash
      })

      if (receipt) {
        addBet({
          receipt,
          bet: {
            amount: `${fixedAmount}`,
            selections,
            selectionsOdds: selectionsOdds!,
          }
        })
      }

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
    selectionsOdds,
    totalOdds,
    submit,
    approveTx: {
      isPending: approveTx.isPending,
      isProcessing: approveReceipt.isLoading,
      data: approveTx.data,
      error: approveTx.error,
    },
    betTx: {
      isPending: betTx.isPending,
      isProcessing: betReceipt.isLoading,
      isSuccess: betReceipt.isSuccess,
      data: betTx.data,
      error: betTx.error,
    },
  }
}
