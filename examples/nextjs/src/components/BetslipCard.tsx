'use client'

import { type BetslipItem } from "@azuro-org/sdk"
import { ConditionStatus } from '@azuro-org/toolkit';
import dayjs from "dayjs"
import React from "react"

type BetslipItemProps = {
  item: BetslipItem
  batchBetAmount: string
  status: ConditionStatus
  odds: number
  isStatusesFetching: boolean
  isOddsFetching: boolean
  isBatch: boolean
  onRemove: (item: BetslipItem) => void
  onBatchAmountChange: (value: string) => void
}

function BetslipCard(props: BetslipItemProps) {
  const { 
    item, batchBetAmount, status, odds, 
    isStatusesFetching, isOddsFetching, isBatch, onRemove, onBatchAmountChange 
  } = props
  const { game: { gameId, startsAt, sportName, leagueName, participants }, outcomeId, marketName, selectionName } = item

  const isLock = !isStatusesFetching && status !== ConditionStatus.Created

  return (
    <div key={`${gameId}-${outcomeId}`} className="bg-zinc-50 p-2 rounded-md mt-2 first-of-type:mt-0">
      <div className="flex items-center justify-between mb-2">
        <div>{sportName} / {leagueName}</div>
        <button onClick={() => onRemove(item)}>Remove</button>
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
        {selectionName}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">Odds: </span>
        {
          isOddsFetching ? (
            <div className="span">Loading...</div>
          ) : (
            odds
          )
        }
      </div>
      {
        isBatch && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">Possible Win: </span>
              {
                isOddsFetching ? (
                  <div className="span">Loading...</div>
                ) : (
                  odds * +batchBetAmount
                )
              }
            </div>
            <input
              className="w-full py-2 px-4 border border-zinc-400 text-md font-semibold rounded-md"
              type="number"
              placeholder="Bet amount"
              value={batchBetAmount}
              onChange={(event) => onBatchAmountChange(event.target.value)}
            />
          </>
        )
      }
      {
        isLock && (
          <div className="text-orange-200 text-center">Outcome removed or suspended</div>
        )
      }
    </div>
  )
}

export default React.memo(BetslipCard)
