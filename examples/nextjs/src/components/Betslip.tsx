'use client'
import React from 'react';
import { useBaseBetslip, useBetTokenBalance, useChain, useDetailedBetslip } from '@azuro-org/sdk';
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries';
import dayjs from 'dayjs';

import { useBetslip } from '@/context/betslip';


function AmountInput() {
  const { amount, setAmount } = useDetailedBetslip()
  const { betToken } = useChain()
  const { loading: isBalanceFetching, balance } = useBetTokenBalance()

  return (
    <div className="mt-4 pt-4 border-t border-zinc-300 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-md text-zinc-400">Wallet balance</span>
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
      <div className="flex items-center justify-between">
        <span className="text-md text-zinc-400">Bet amount</span>
        <input
          className="w-[140px] py-2 px-4 border border-zinc-400 text-md text-right font-semibold rounded-md"
          type="number"
          placeholder="Bet amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>
    </div>
  )
}

function Content() {
  const { items, clear, removeItem } = useBaseBetslip()
  const { odds, totalOdds, isOddsFetching } = useDetailedBetslip()


  return (
    <div className="bg-zinc-100 p-4 mb-4 rounded-md w-full max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="">Betslip {items.length > 1 ? 'Combo' : 'Single'} {items.length ? `(${items.length})`: ''}</div>
        {
          Boolean(items.length) && (
            <button onClick={clear}>Remove All</button>
          )
        }
      </div>
      {
        Boolean(items.length) ? (
          <>
            <div className="max-h-[300px] overflow-auto">
              {
                items.map(item => {
                  const { game: { gameId, startsAt, sportName, leagueName, participants }, conditionId, outcomeId } = item

                  const marketName = getMarketName({ outcomeId })
                  const selection = getSelectionName({ outcomeId, withPoint: true })

                  return (
                    <div key={gameId} className="bg-zinc-50 p-2 rounded-md mt-2 first-of-type:mt-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>{sportName} / {leagueName}</div>
                        <button onClick={() => removeItem(gameId)}>Remove</button>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        {
                          participants.map(({ image, name }) => (
                            <div key={name} className="flex items-center ml-2 first-of-type:ml-0">
                              <div className="flex items-center justify-center w-8 h-8 p-1 mr-2 border border-zinc-300 rounded-full">
                                {
                                  Boolean(image) && (
                                    <img className="w-full h-full" src={image!} alt="" />
                                  )
                                }
                              </div>
                              <span className="text-md">{name}</span>
                            </div>
                          ))
                        }
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">Start Date: </span> 
                        {dayjs(+startsAt * 1000).format('DD MMM HH:mm')}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">Market: </span> 
                        {marketName}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">Selection: </span> 
                        {selection}
                      </div>
                      <div className="flex items-center justify-between ">
                        <span className="font-bold">Odds: </span>
                        {
                          isOddsFetching ? (
                            <div className="span">Loading...</div>
                          ) : (
                            odds[`${conditionId}-${outcomeId}`]
                          )
                        }
                      </div>
                    </div>
                  )
                })
              }
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-md text-zinc-400">Total Odds</span>
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
            <AmountInput />
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
  );
}
