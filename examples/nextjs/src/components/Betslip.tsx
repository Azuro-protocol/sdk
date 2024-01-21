'use client'
import React from 'react';
import { useBaseBetslip } from '@azuro-org/sdk';
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries';
import dayjs from 'dayjs';

import { useBetslip } from '@/context/betslip';

function Content() {
  const { items, clear, removeItem } = useBaseBetslip()

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
          <div className="max-h-[300px] overflow-auto">
          {
            items.map(item => {
              const { game: { gameId, startsAt, sportName, leagueName, participants }, outcomeId } = item

              const marketName = getMarketName({ outcomeId })
              const selection = getSelectionName({ outcomeId })

              return (
                <div key={gameId} className="bg-zinc-50 p-2 rounded-md mt-2 first-of-type:mt-0">
                  <div className="flex items-center justify-between">
                    <div className="mb-2">{sportName} / {leagueName}</div>
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
                  <div className="mb-2">Start Date: {dayjs(+startsAt * 1000).format('DD MMM HH:mm')}</div>
                  <div className="mb-2">Market: {marketName}</div>
                  <div className="">Selection: {selection}</div>
                </div>
              )
            })
          }
          </div>
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
