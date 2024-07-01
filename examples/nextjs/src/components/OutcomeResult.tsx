'use client'
import { type MarketOutcome, ConditionStatus } from '@azuro-org/sdk'
import cx from 'clsx';

type OutcomeProps = {
  className?: string
  outcome: MarketOutcome
}

export function OutcomeResult(props: OutcomeProps) {
  const { className, outcome } = props
  const { status, isWon } = outcome

  const isCanceled = status === ConditionStatus.Canceled

  const buttonClassName = cx(`flex justify-between p-5 transition rounded-2xl w-full ${className}`, 
    {
      'bg-green-300': isWon && !isCanceled,
      'bg-red-300': !isWon && !isCanceled,
      'bg-slate-200': isCanceled,
    }
  )

  return (
    <div
      className={buttonClassName}
    >
      <span className="text-zinc-500">{outcome.selectionName}</span>
      {
        isCanceled && (
          <div className="">Refunded</div>
        )
      }
      {/* {
        Boolean(!isCanceled && betSummaryTitle) && (
          <div className={betsSummaryClassName}>{`${formatToFixed(betSummaryTitle, 2)} ${betToken.symbol}`}</div>
        )
      } */}
    </div>
  )
}
