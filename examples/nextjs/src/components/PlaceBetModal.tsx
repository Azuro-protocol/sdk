'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useChain, usePlaceBet, useGame, useBetTokenBalance } from '@azuro-org/sdk'
import { getMarketName } from '@azuro-org/dictionaries'
import { GameInfo } from '@/components'
import cx from 'clsx'


type Props = {
  outcome: any
  closeModal: any
}

export function PlaceBetModal(props: Props) {
  const { outcome, closeModal } = props

  const params = useParams()
  const account = useAccount()
  const { appChain, betToken, isRightNetwork } = useChain()
  const { loading: isBalanceFetching, balance } = useBetTokenBalance()

  const [ amount, setAmount ] = useState('')

  const { data } = useGame({
    id: params.id as string,
  })

  const {
    isAllowanceLoading,
    isApproveRequired,
    submit,
    approveTx,
    betTx,
  } = usePlaceBet({
    amount,
    minOdds: 1.5,
    deadline: 60, // 1 min
    affiliate: '0x0000000000000000000000000000000000000000', // your affiliate address
    selections: [
      {
        conditionId: outcome.conditionId,
        outcomeId: outcome.outcomeId,
      },
    ],
  })

  console.log(222, isApproveRequired)

  const amountsNode = (
    <div className="mt-4 pt-4 border-t border-zinc-300 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-md text-zinc-400">Wallet balance</span>
        <span className="text-md font-semibold">
          {isBalanceFetching ? 'Loading...' : balance?.toFixed(2)} {betToken.symbol}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-md text-zinc-400">Bet amount</span>
        <input
          className="w-[140px] py-2 px-4 border border-zinc-400 text-md text-right font-semibold rounded-md"
          type="number"
          placeholder="Bet amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>
    </div>
  )

  let button

  if (!account.address) {
    button = (
      <div className="mt-6 py-3.5 text-center bg-red-200 rounded-2xl">
        Connect your wallet
      </div>
    )
  }
  else if (!isRightNetwork) {
    button = (
      <div className="mt-6 py-3.5 text-center bg-red-200 rounded-2xl">
        Switch network to <b>{appChain.name}</b> in your wallet
      </div>
    )
  }
  else {
    const isPending = approveTx.isPending || betTx.isPending
    const isSubmitting = approveTx.isProcessing  || betTx.isProcessing
    const isEnoughBalance = Boolean(+amount && balance && +balance > +amount)

    const isDisabled = (
      isBalanceFetching
      || !isEnoughBalance
      || isAllowanceLoading
      || isPending
      || isSubmitting
      || !+amount
    )

    let title

    if (isPending) {
      title = 'Waiting for approval'
    }
    else if (isSubmitting) {
      title = 'Processing...'
    }
    else if (isApproveRequired) {
      title = 'Approve'
    }
    else {
      title = 'Place Bet'
    }

    button = (
      <div className="mt-6">
        {
          Boolean(+amount && !isEnoughBalance) && (
            <div className="mb-1 text-red-500 text-center font-semibold">
              Not enough balance.
            </div>
          )
        }
        <button
          className={cx('w-full py-3.5 text-white font-semibold text-center rounded-xl', {
            'bg-blue-500 hover:bg-blue-600 transition shadow-md': !isDisabled,
            'bg-zinc-300 cursor-not-allowed': isDisabled,
          })}
          disabled={isDisabled}
          onClick={submit}
        >
          {title}
        </button>
      </div>
    )
  }

  const marketName = getMarketName({ outcomeId: outcome.outcomeId })

  return (
    <div
      className="fixed top-0 left-0 z-50 w-full h-full flex items-center justify-center bg-black bg-opacity-20"
      onClick={closeModal}
    >
      <div
        className="w-[480px] bg-white overflow-hidden rounded-[40px] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <GameInfo game={data?.game} />
        <div className="pt-4 px-6 pb-6">
          <div className="grid grid-cols-[auto_1fr] gap-y-3 mt-2 text-md">
            <span className="text-zinc-400">Market</span>
            <span className="text-right font-semibold">{marketName}</span>
            <span className="text-zinc-400">Selection</span>
            <span className="text-right font-semibold">{outcome.selectionName}</span>
            <span className="text-zinc-400">Odds</span>
            <span className="text-right font-semibold">{outcome.odds}</span>
          </div>
          {amountsNode}
          {button}
        </div>
      </div>
    </div>
  )
}
