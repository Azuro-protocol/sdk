'use client'
import { type MarketOutcome, useOutcome } from '@azuro-org/sdk'

type OutcomeProps = {
  className?: string
  outcome: MarketOutcome
  onClick: (outcome: MarketOutcome) => void
}

export function OutcomeButton(props: OutcomeProps) {
  const { className, outcome, onClick } = props

  const { odds, isLocked, isOddsFetching } = useOutcome({
    selection: outcome,
    initialOdds: outcome.odds,
    initialStatus: outcome.status,
  })

  const buttonClassName = `flex justify-between p-5 bg-zinc-50 hover:bg-zinc-100 transition rounded-2xl cursor-pointer w-full disabled:cursor-not-allowed disabled:opacity-50 ${className}`

  return (
    <button
      className={buttonClassName}
      onClick={() => onClick(outcome)}
      disabled={isLocked}
    >
      <span className="text-zinc-500">{outcome.selectionName}</span>
      <span className="font-medium">{isOddsFetching ? '--' : parseFloat(odds).toFixed(2)}</span>
    </button>
  )
}
