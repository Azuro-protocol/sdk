'use client'
import { useBaseBetslip, useBetTokenBalance, useChain, useDetailedBetslip, usePrepareBet } from "@azuro-org/sdk"
import cx from 'clsx'
import type { Address } from 'viem'

export const BetButton: React.FC = () => {
  const { appChain, isRightNetwork } = useChain()
  const { items, clear } = useBaseBetslip()
  const { betAmount, batchBetAmounts, odds, totalOdds, selectedFreeBet, isBatch, isStatusesFetching, isOddsFetching, isBetAllowed } = useDetailedBetslip()
  const { loading: isBalanceFetching, balance } = useBetTokenBalance()

  const {
    submit,
    approveTx,
    betTx,
    isRelayerFeeLoading,
    isAllowanceLoading,
    isApproveRequired,
  } = usePrepareBet({
    betAmount: isBatch ? batchBetAmounts : betAmount,
    slippage: 10,
    affiliate: process.env.NEXT_PUBLIC_AFFILIATE_ADDRESS as Address, // your affiliate address
    selections: items,
    odds,
    totalOdds,
    freeBet: selectedFreeBet,
    onSuccess: () => {
      clear()
    },
  })

  const isPending = approveTx.isPending || betTx.isPending
  const isProcessing = approveTx.isProcessing  || betTx.isProcessing

  if (!isRightNetwork) {
    return (
      <div className="mt-6 py-3.5 text-center bg-red-200 rounded-2xl">
        Switch network to <b>{appChain.name}</b> in your wallet
      </div>
    )
  }

  const isEnoughBalance = isBalanceFetching || !Boolean(+betAmount) || Boolean(selectedFreeBet) || Boolean(+balance! > +betAmount)

  const isLoading = (
    isOddsFetching
    || isBalanceFetching
    || isStatusesFetching
    || isAllowanceLoading
    || isPending
    || isProcessing
    || isRelayerFeeLoading
  )

  const isDisabled = (
    isLoading
    || !isBetAllowed
    || !isEnoughBalance
    || !+betAmount
  )

  let title

  if (isPending) {
    title = 'Waiting for approval'
  }
  else if (isProcessing) {
    title = 'Processing...'
  }
  else if (isLoading) {
    title = 'Loading...'
  }
  else if (isApproveRequired) {
    title = 'Approve'
  }
  else {
    title = 'Place Bet'
  }

  return (
    <div className="mt-6">
      {
        !isEnoughBalance && (
          <div className="mb-1 text-red-500 text-center font-semibold">
            Not enough balance.
          </div>
        )
      }
      <button
        className={cx('w-full py-3.5 text-white font-semibold text-center rounded-xl', {
          'bg-blue-500 hover:bg-blue-600 transition shadow-md': !isDisabled,
          'bg-zinc-300 cursor-not-allowed': isDisabled,
        })}
        disabled={isDisabled}
        onClick={submit}
      >
        {title}
      </button>
    </div>
  )
}
