'use client'
import { type MarketOutcome, useSelectionOdds, useConditionStatus } from '@azuro-org/sdk'
import { ConditionStatus } from '@azuro-org/sdk'

type OutcomeProps = {
  className?: string
  outcome: MarketOutcome
  onClick: (outcome: MarketOutcome) => void
}

export function OutcomeButton(props: OutcomeProps) {
  const { className, outcome, onClick } = props

  const odds = useSelectionOdds({
    selection: outcome,
    initialOdds: outcome.odds,
  })
  const status = useConditionStatus({
    conditionId: outcome.conditionId,
    initialStatus: outcome.status,
  })

  const isDisabled = status !== ConditionStatus.Created

  const buttonClassName = `flex justify-between p-5 bg-zinc-50 hover:bg-zinc-100 transition rounded-2xl cursor-pointer w-full disabled:cursor-not-allowed ${className}`

  return (
    <button
      className={buttonClassName}
      onClick={() => onClick(outcome)}
      disabled={isDisabled}
    >
      <span className="text-zinc-500">{outcome.selectionName}</span>
      <span className="font-medium">{parseFloat(odds).toFixed(2)}</span>
    </button>
  )
}
