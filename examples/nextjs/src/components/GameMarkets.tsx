'use client'
import { GameStatus, type GameMarkets } from '@azuro-org/sdk/utils';
import { OutcomeButton, OutcomeResult } from '@/components'


type GameMarketsProps = {
  markets: GameMarkets
  betsSummary?: Record<string, string>
  isResult?: boolean
}

export function GameMarkets(props: GameMarketsProps) {
  const { markets, betsSummary, isResult } = props

  return (
    <div className="max-w-[600px] mx-auto space-y-6">
      {
        markets.map(({ name, outcomeRows }) => (
          <div key={name} className="">
            <div className="mb-2 text-lg font-semibold">{name}</div>
            <div className="space-y-1">
              {
                outcomeRows.map((outcomes, index) => (
                  <div key={index} className="flex justify-between">
                    <div className="flex gap-2 w-full">
                      {
                        outcomes.map((outcome) => {
                          const key = outcome.outcomeId

                          if (isResult) {
                            return (
                              <OutcomeResult 
                                key={key}
                                outcome={outcome}
                                summary={betsSummary?.[key]}
                              />
                            )
                          }

                          return (
                            <OutcomeButton
                              key={key}
                              outcome={outcome}
                            />
                          )
                        })
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
  )
}
