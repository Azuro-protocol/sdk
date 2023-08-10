import { useRef } from 'react'
import { erc20ABI, useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import { parseUnits, encodeAbiParameters, parseAbiParameters } from 'viem'
import { useChain } from '../contexts/chain'
import { DEFAULT_DEADLINE, ODDS_DECIMALS, MAX_UINT_256 } from '../config'
import { usePublicClient } from './usePublicClient'


type Props = {
  amount: string | number
  minOdds: number
  deadline?: number
  affiliate: `0x${string}`
  selections: {
    conditionId: string | bigint
    outcomeId: string | number
  }[]
}

export const usePlaceBet = (props: Props) => {
  const { amount, minOdds, deadline, affiliate, selections } = props

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
    enabled: Boolean(account.address) && !betToken.isNative,
  })

  const allowanceRef = useRef<bigint | undefined>()

  if (
    allowanceRef.current === undefined
    && allowanceTx.data !== undefined
  ) {
    allowanceRef.current = allowanceTx.data
  }

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
    !betToken.isNative
    && allowanceTx.data !== undefined
    && +amount
    && allowanceTx.data < parseUnits(`${+amount}`, betToken.decimals)
  )

  const approve = async () => {
    const tx = await approveTx.writeAsync()

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: tx.hash,
      confirmations: 12,
    })

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
    const fixedAmount = +parseFloat(String(amount)).toFixed(betToken.decimals)
    const rawAmount = parseUnits(`${fixedAmount}`, betToken.decimals)

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
      value: betToken.isNative ? rawAmount : BigInt(0),
    })

    return publicClient.waitForTransactionReceipt({
      hash: tx.hash,
      confirmations: 12,
    })
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
      isPending: approveTx.isLoading,
      isProcessing: approveReceipt.isLoading,
      data: approveTx.data,
      error: approveTx.error,
    },
    betTx: {
      isPending: betTx.isLoading,
      isProcessing: betReceipt.isLoading,
      data: betTx.data,
      error: betTx.error,
    },
  }
}
