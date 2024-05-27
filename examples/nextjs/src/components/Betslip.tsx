'use client'
import React, { useEffect, useState } from 'react'
import { 
  useBaseBetslip, 
  useBetTokenBalance, 
  useChain, 
  useDetailedBetslip, 
  BetslipDisableReason,
  useDeBridgeSupportedChains,
  useLiveBetFee,
} from '@azuro-org/sdk'
import { useAccount } from 'wagmi'

import { useBetslip } from '@/context/betslip'

import { BetButton, DeBridgeBetButton, BetslipCard } from './index'


function AmountInput() {
  const { betAmount, changeBetAmount, maxBet, minBet } = useDetailedBetslip()
  const { betToken } = useChain()
  const { loading: isBalanceFetching, balance } = useBetTokenBalance()

  return (
    <div className="mt-4 pt-4 border-t border-zinc-300 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-md text-zinc-400">Wallet balance:</span>
        <span className="text-md font-semibold">
          {
            isBalanceFetching ? (
              <>Loading...</>
            ) : (
              balance !== undefined ? (
                <>{(+balance).toFixed(2)} {betToken.symbol}</>
              ) : (
                <>-</>
              )
            )
          }
        </span>
      </div>
      {
        Boolean(maxBet) && <div className="flex items-center justify-between">
          <span className="text-md text-zinc-400">Max bet amount:</span>
          <span className="text-md font-semibold">{maxBet} {betToken.symbol}</span>
        </div>
      }
      {
        Boolean(minBet) && <div className="flex items-center justify-between">
          <span className="text-md text-zinc-400">Min bet amount:</span>
          <span className="text-md font-semibold">{minBet} {betToken.symbol}</span>
        </div>
      }
      <div className="flex items-center justify-between">
        <span className="text-md text-zinc-400">Bet amount</span>
        <input
          className="w-[140px] py-2 px-4 border border-zinc-400 text-md text-right font-semibold rounded-md"
          type="number"
          placeholder="Bet amount"
          value={betAmount}
          onChange={(event) => changeBetAmount(event.target.value)}
        />
      </div>
    </div>
  )
}

const errorPerDisableReason = {
  [BetslipDisableReason.ComboWithForbiddenItem]: 'One or more conditions can\'t be used in combo',
  [BetslipDisableReason.BetAmountGreaterThanMaxBet]: 'Bet amount exceeds max bet',
  [BetslipDisableReason.BetAmountLowerThanMinBet]: 'Bet amount lower than min bet',
  [BetslipDisableReason.ComboWithLive]: 'Live outcome can\'t be used in combo',
  [BetslipDisableReason.ConditionStatus]: 'One or more outcomes have been removed or suspended. Review your betslip and remove them.',
  [BetslipDisableReason.PrematchConditionInStartedGame]: 'Game has started',
  [BetslipDisableReason.ComboWithSameGame]: 'Combo with outcomes from same game prohibited, please use Batch bet',
  [BetslipDisableReason.BatchWithLive]: 'Live outcome can\'t be used in batch',
} as const

function Content() {
  const account = useAccount()
  const { items, clear, removeItem } = useBaseBetslip()
  const { 
    betAmount, batchBetAmounts, odds, totalOdds, statuses, disableReason, 
    isBatch, isStatusesFetching, isOddsFetching, isLiveBet, changeBatch, changeBatchBetAmount
  } = useDetailedBetslip()
  const { appChain, betToken } = useChain()
  const { supportedChainIds } = useDeBridgeSupportedChains()
  const { formattedRelayerFeeAmount, loading: isRelayerFeeLoading } = useLiveBetFee({
    enabled: isLiveBet,
  })
  const [ isDeBridgeEnable, setDeBridgeEnable ] = useState(false)

  const isDeBridgeVisible = supportedChainIds?.includes(appChain.id)

  const handleDeBridgeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDeBridgeEnable(event.target.checked)
  }

  useEffect(() => {
    if (isLiveBet || isBatch || !isDeBridgeVisible) {
      setDeBridgeEnable(false)
    }
  }, [ isLiveBet, isBatch, isDeBridgeVisible ])

  useEffect(() => {
    if (isDeBridgeEnable) {
      changeBatch(false)
    }
  }, [ isDeBridgeEnable ])

  return (
    <div className="bg-zinc-100 p-4 mb-4 rounded-md w-full max-h-[90vh] overflow-auto border border-solid">
      <div className="flex items-center justify-between mb-2">
        <div className="">
          Betslip {items.length > 1 ? isBatch ? 'Batch' : 'Combo' : 'Single'} {items.length ? `(${items.length})`: ''}
        </div>
        {
          Boolean(items.length) && (
            <button onClick={clear}>Remove All</button>
          )
        }
      </div>
      {
        Boolean(items.length) ? (
          <>
            <div className="max-h-[50vh] overflow-auto">
              {
                items.map(item => {
                  const { game: { gameId }, conditionId, outcomeId } = item
                  
                  return (
                    <BetslipCard 
                      key={`${gameId}-${outcomeId}`}
                      item={item} 
                      batchBetAmount={batchBetAmounts[`${conditionId}-${outcomeId}`]}
                      status={statuses[conditionId]}
                      odds={odds?.[`${conditionId}-${outcomeId}`]}
                      isStatusesFetching={isStatusesFetching}
                      isOddsFetching={isOddsFetching}
                      onRemove={() => removeItem(item)}
                      onBatchAmountChange={(value) => changeBatchBetAmount(item, value)}
                      isBatch={isBatch}
                    />
                  )
                 
                })
              }
            </div>
            {
              Boolean(items.length > 1 && !isDeBridgeEnable) && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-md text-zinc-400">Batch Bet:</span>
                  <input type="checkbox" checked={isBatch} onChange={(e) => changeBatch(e.target.checked)} />
                </div>
              )
            }
            {
              isBatch ? (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-md text-zinc-400">Total Bet Amount:</span>
                  <span className="text-md font-semibold">{betAmount} {betToken.symbol}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-md text-zinc-400">Total Odds:</span>
                  <span className="text-md font-semibold">
                    {
                      isOddsFetching ? (
                        <>Loading...</>
                      ) : (
                        <>{ totalOdds }</>
                      )
                    }
                  </span>
                </div>
              )
            }
            <div className="flex items-center justify-between mt-4">
              <span className="text-md text-zinc-400">Possible win:</span>
              <span className="text-md font-semibold">
                {
                  isOddsFetching ? (
                    <>Loading...</>
                  ) : (
                    <>{totalOdds * +betAmount}</>
                  )
                }
              </span>
            </div>
            {
              Boolean(isRelayerFeeLoading || formattedRelayerFeeAmount) && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-md text-zinc-400">Relayer fee:</span>
                  <span className="text-md font-semibold">
                    {
                      isRelayerFeeLoading ? (
                        <>Loading...</>
                      ) : (
                        <>{formattedRelayerFeeAmount}</>
                      )
                    }
                  </span>
                </div>
              )
            }
            {
              !isBatch && (
                <AmountInput />
              )
            }
            {
              Boolean(!isLiveBet && isDeBridgeVisible) && (
                <div className="flex items-center justify-between mt-4 border-t border-zinc-300 pt-4">
                  <label className="mr-2" htmlFor="deBridge">Bet from another blockchain</label>
                  <input id="deBridge" type="checkbox" checked={isDeBridgeEnable} onChange={handleDeBridgeChange} />
                </div>
              )
            }
            {
              Boolean(disableReason) && (
                <div className="mb-1 text-red-500 text-center font-semibold">
                  {errorPerDisableReason[disableReason!]}
                </div>
              )
            }
            {
              account?.address ? (
                <>
                  {
                    isDeBridgeEnable ? (
                      <DeBridgeBetButton />
                    ) : (
                      <BetButton />
                    )
                  }
                </>
              ) : (
                <div className="mt-6 py-3.5 text-center bg-red-200 rounded-2xl">
                Connect your wallet
              </div>
              )
            }
          </>
        ) : (
          <div>Empty</div>
        )
      }
    </div>
  )
}

export function Betslip() {
  const { isOpen, setOpen } = useBetslip()
  const { items } = useBaseBetslip()

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-full md:max-w-sm">
      {
        isOpen && (
          <Content />
        )
      }
      <button 
        className="flex items-center py-2 px-4 bg-zinc-100 whitespace-nowrap rounded-full ml-auto"
        onClick={() => setOpen(!isOpen)}
      >
        Betslip {items.length || ''}
      </button>
    </div>
  )
}
