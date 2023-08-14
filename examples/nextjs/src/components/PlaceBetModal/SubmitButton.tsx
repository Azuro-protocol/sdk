import React from 'react'
import { useAccount } from 'wagmi'
import { useChain, useBetTokenBalance, usePlaceBet } from '@azuro-org/sdk'
import cx from 'clsx'


type Props = {
  amount: string
  outcome: {
    conditionId: string
    outcomeId: string
  }
  onSuccess(): void
}

export const SubmitButton: React.FC<Props> = (props) => {
  const { amount, outcome, onSuccess } = props

  const account = useAccount()
  const { appChain, isRightNetwork } = useChain()
  const { loading: isBalanceFetching, balance } = useBetTokenBalance()

  const {
    isAllowanceLoading,
    isApproveRequired,
    submit,
    approveTx,
    betTx,
  } = usePlaceBet({
    amount,
    minOdds: 1.5, // TODO slippage - added on 8/10/23 by pavelivanov
    affiliate: '0x0000000000000000000000000000000000000000', // your affiliate address
    selections: [
      {
        conditionId: outcome.conditionId,
        outcomeId: outcome.outcomeId,
      },
    ],
    onSuccess,
  })

  if (!account.address) {
    return (
      <div className="mt-6 py-3.5 text-center bg-red-200 rounded-2xl">
        Connect your wallet
      </div>
    )
  }

  if (!isRightNetwork) {
    return (
      <div className="mt-6 py-3.5 text-center bg-red-200 rounded-2xl">
        Switch network to <b>{appChain.name}</b> in your wallet
      </div>
    )
  }
  const isPending = approveTx.isPending || betTx.isPending
  const isProcessing = approveTx.isProcessing  || betTx.isProcessing
  const isEnoughBalance = Boolean(+amount && balance && +balance > +amount)

  const isDisabled = (
    isBalanceFetching
    || !isEnoughBalance
    || isAllowanceLoading
    || isPending
    || isProcessing
    || !+amount
  )

  let title

  if (isPending) {
    title = 'Waiting for approval'
  }
  else if (isProcessing) {
    title = 'Processing...'
  }
  else if (isApproveRequired) {
    title = 'Approve'
  }
  else {
    title = 'Place Bet'
  }

  return (
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
