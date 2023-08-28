import React from 'react'
import { useAccount } from 'wagmi'
import { useChain, useBetTokenBalance } from '@azuro-org/sdk'
import cx from 'clsx'


type Props = {
  amount: string
  isAllowanceLoading: boolean
  isApproveRequired: boolean
  isPending: boolean
  isProcessing: boolean
  onClick(): void
}

export const SubmitButton: React.FC<Props> = (props) => {
  const { amount, isAllowanceLoading, isApproveRequired, isPending, isProcessing, onClick } = props

  const account = useAccount()
  const { appChain, isRightNetwork } = useChain()
  const { loading: isBalanceFetching, balance } = useBetTokenBalance()

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
        onClick={onClick}
      >
        {title}
      </button>
    </div>
  )
}
