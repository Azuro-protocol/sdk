'use client'
import { useState } from "react";
import { useBaseBetslip, useDeBridgeBet, useDetailedBetslip } from "@azuro-org/sdk";
import cx from 'clsx'
import { formatUnits } from "viem";


export const DeBridgeBetButton = () => {
  const { items, clear } = useBaseBetslip()
  const { betAmount, totalOdds, isStatusesFetching, isOddsFetching, isBetAllowed } = useDetailedBetslip()
  const [ fromChainId, setFromChainId ] = useState('')
  const [ fromTokenAddress, setFromTokenAddress ] = useState('')
  const { 
    submit, approveTx, betTx, estimation, fixFee,
    isAllowanceLoading, isApproveRequired, isTxReady, loading: isDeBridgeLoading 
  } = useDeBridgeBet({
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
    <div className="mt-2">
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
      <div className="flex items-center justify-between mt-4">
        <span className="text-md text-zinc-400">Required amount:</span>
        <span className="text-md font-semibold">
          {
            isDeBridgeLoading ? (
              <>Loading...</>
            ) : (
              <>
                {
                  Boolean(estimation) ? (
                    <>
                      {formatUnits(BigInt(estimation!.srcChainTokenIn.amount), estimation!.srcChainTokenIn.decimals)} {estimation!.srcChainTokenIn.symbol.toUpperCase()}
                    </>
                  ) : (
                    0
                  )
                }
              </>
            )
          }
        </span>
      </div>
      {
        estimation?.srcChainTokenIn?.mutatedWithOperatingExpense && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-md text-zinc-400">Incl. gas expense:</span>
            <span className="text-md font-semibold">
              {
                isDeBridgeLoading ? (
                  <>Loading...</>
                ) : (
                  <>
                    {
                      Boolean(estimation) ? (
                        <>
                          {formatUnits(BigInt(estimation!.srcChainTokenIn.approximateOperatingExpense), estimation!.srcChainTokenIn.decimals)} {estimation!.srcChainTokenIn.symbol.toUpperCase()}
                        </>
                      ) : (
                        0
                      )
                    }
                  </>
                )
              }
            </span>
          </div>
        )
      }
      <div className="flex items-center justify-between mt-4">
        <span className="text-md text-zinc-400">Service fixed fee:</span>
        <span className="text-md font-semibold">
          {
            isDeBridgeLoading ? (
              <>Loading...</>
            ) : (
              <>{formatUnits(BigInt(fixFee || '0'), 18)}</>
            )
          }
        </span>
      </div>
      <button
        className={cx('w-full py-3.5 text-white font-semibold text-center rounded-xl mt-6', {
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
