'use client'
import { useState } from 'react'
import { type GameQuery } from '@azuro-org/sdk'

type Props = {
  game: GameQuery['game']
  markets: any
}

export function GameMarkets(props: Props) {
  const { game, markets } = props

  const [ selectedOutcome, setSelectedOutcome ] = useState(null)

  const handleOutcomeClick = (outcome) => {
    setSelectedOutcome(outcome)
  }

  const handleModalClose = () => {
    setSelectedOutcome(null)
  }

  return (
    <>
      <div className="max-w-[600px] mx-auto mt-12 space-y-6">
        {
          markets.map(({ marketName, outcomes: row }) => (
            <div key={marketName} className="">
              <div className="mb-2 font-semibold">{marketName}</div>
              <div className="space-y-1">
                {
                  row.map((outcomes, index) => (
                    <div key={index} className="flex justify-between">
                      <div className="flex gap-1 w-full">
                        {
                          outcomes.map((outcome) => (
                            <div
                              key={outcome.selectionName}
                              className="flex justify-between py-2 px-3 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition"
                              style={{ width: `calc(100% / ${outcomes.length})` }}
                              onClick={() => handleOutcomeClick(outcome)}
                            >
                              <span className="text-gray-500">{outcome.selectionName}</span>
                              <span className="font-medium">{parseFloat(outcome.odds).toFixed(2)}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          ))
        }
      </div>
      {
        Boolean(selectedOutcome) && (
          <PlaceBetModal
            game={game}
            outcome={selectedOutcome}
            closeModal={handleModalClose}
          />
        )
      }
    </>
  )
}
