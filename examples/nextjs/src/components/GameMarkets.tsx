'use client'
import { useState } from 'react'
import { type GameMarkets } from '@azuro-org/sdk'
import { PlaceBetModal, OutcomeButton } from '@/components'


type GameMarketsProps = {
  markets: GameMarkets
}

export function GameMarkets(props: GameMarketsProps) {
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
                            <OutcomeButton 
                              key={outcome.selectionName} 
                              outcome={outcome} 
                              onClick={() => handleOutcomeClick(outcome)} 
                            />
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
