'use client'
import { useState } from "react";
import { useBaseBetslip, useDeBridgeBet, useDetailedBetslip } from "@azuro-org/sdk";
import cx from 'clsx'


export const DeBridgeBetButton = () => {
  const { items, clear } = useBaseBetslip()
  const { betAmount, totalOdds, isStatusesFetching, isOddsFetching, isBetAllowed } = useDetailedBetslip()
  const [fromChainId, setFromChainId] = useState('')
  const [fromTokenAddress, setFromTokenAddress] = useState('')
  const { submit, approveTx, betTx, isAllowanceLoading, isApproveRequired, isTxReady, loading: isDeBridgeLoading } = useDeBridgeBet({
    // fromChainId: 42161,
    // fromTokenAddress: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    fromChainId: +fromChainId,
    fromTokenAddress,
    betAmount,
    slippage: 10,
    affiliate: '0x68E0C1dBF926cDa7A65ef2722e046746EB0f816f', // your affiliate address
    selections: items,
    totalOdds,
    onSuccess: () => {
      clear()
    },
    onError: (err) => {
      console.log(err);
    }
  })

  const isPending = approveTx.isPending || betTx.isPending
  const isProcessing = approveTx.isProcessing  || betTx.isProcessing


  const isLoading = (
    isOddsFetching
    || isDeBridgeLoading
    || isStatusesFetching
    || isAllowanceLoading
    || isPending
    || isProcessing
  )

  const isDisabled = (
    isLoading
    || !isTxReady
    || !isBetAllowed
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-md text-zinc-400">ChainId</span>
        <input
          className="w-[140px] py-2 px-4 border border-zinc-400 text-md text-right font-semibold rounded-md"
          type="number"
          placeholder="chain id"
          value={fromChainId}
          onChange={(event) => setFromChainId(event.target.value)}
        />
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-md text-zinc-400">Token Address</span>
        <input
          className="w-[140px] py-2 px-4 border border-zinc-400 text-md text-right font-semibold rounded-md"
          placeholder="token address"
          value={fromTokenAddress}
          onChange={(event) => setFromTokenAddress(event.target.value)}
        />
      </div>
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
