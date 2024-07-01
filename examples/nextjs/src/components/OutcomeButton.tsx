'use client'
import { useSelection, useBaseBetslip } from '@azuro-org/sdk'
import { type MarketOutcome } from '@azuro-org/sdk/utils'
import cx from 'clsx';

type OutcomeProps = {
  className?: string
  outcome: MarketOutcome
}

export function OutcomeButton(props: OutcomeProps) {
  const { className, outcome } = props

  const { items, addItem, removeItem } = useBaseBetslip()
  const { odds, isLocked, isOddsFetching } = useSelection({
    selection: outcome,
    initialOdds: outcome.odds,
    initialStatus: outcome.status,
  })

  const isActive = Boolean(items?.find((item) => {
    const propsKey = `${outcome.coreAddress}-${outcome.lpAddress}-${outcome.gameId}-${outcome.conditionId}-${outcome.outcomeId}`
    const itemKey = `${item.coreAddress}-${item.lpAddress}-${item.game.gameId}-${item.conditionId}-${item.outcomeId}`

    return propsKey === itemKey
  }))

  const buttonClassName = cx(`flex justify-between p-5 transition rounded-2xl cursor-pointer w-full disabled:cursor-not-allowed disabled:opacity-50 ${className}`, {
    'bg-slate-200 hover:bg-slate-300': isActive,
    'bg-zinc-50 hover:bg-zinc-100': !isActive,
  })

  const handleClick = () => {
    if (isActive) {
      removeItem(outcome)
    } else {
      addItem(outcome)
    }
  }

  return (
    <button
      className={buttonClassName}
      onClick={handleClick}
      disabled={isLocked}
    >
      <span className="text-zinc-500">{outcome.selectionName}</span>
      <span className="font-medium">{isOddsFetching ? '--' : odds.toFixed(2)}</span>
    </button>
  )
}
