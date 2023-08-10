'use client'
import { useState } from 'react'
import { type GameMarkets } from '@azuro-org/sdk'
import { PlaceBetModal } from '@/components'


type Props = {
  markets: GameMarkets
}

export function GameMarkets(props: Props) {
  const { markets } = props

  const [ selectedOutcome, setSelectedOutcome ] = useState(null)

  const handleOutcomeClick = (outcome: any) => {
    setSelectedOutcome(outcome)
  }

  const handleModalClose = () => {
    setSelectedOutcome(null)
  }

  return (
    <>
      <div className="max-w-[600px] mx-auto mt-12 space-y-6">
        {
          markets.map(({ name, description, selections: row }) => (
            <div key={name} className="">
              <div className="mb-2 text-lg font-semibold">{name}</div>
              <div className="space-y-1">
                {
                  row.map((outcomes, index) => (
                    <div key={index} className="flex justify-between">
                      <div className="flex gap-2 w-full">
                        {
                          outcomes.map((outcome) => (
                            <div
                              key={outcome.selectionName}
                              className="flex justify-between p-5 bg-zinc-50 hover:bg-zinc-100 transition rounded-2xl cursor-pointer"
                              style={{ width: `calc(100% / ${outcomes.length})` }}
                              onClick={() => handleOutcomeClick(outcome)}
                            >
                              <span className="text-zinc-500">{outcome.selectionName}</span>
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
            outcome={selectedOutcome}
            closeModal={handleModalClose}
          />
        )
      }
    </>
  )
}
