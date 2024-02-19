'use client'
import React from 'react'
import { type Bet, useRedeemBet } from '@azuro-org/sdk'
import cx from 'clsx'

type Props = {
  bets: Array<Bet>
}

export function RedeemAll(props: Props) {
  const { bets } = props

  const { submit, isPending, isProcessing } = useRedeemBet()

  const unredeemedBets = bets?.filter((bet) => (
    !(bet as Bet).freebetContractAddress
    && bet.isRedeemable
  ))

  const isDisabled = !unredeemedBets.length || isPending || isProcessing

  const handleRedeem = async () => {
    try {
      await submit({ bets: unredeemedBets })
    } catch {}
  }

  let buttonTitle = 'Redeem all'
  
  if (isPending) {
    buttonTitle = 'Waiting for approval'
  }
  else if (isProcessing) {
    buttonTitle = 'Processing...'
  }

  return (
    <button
      className={cx('md:w-[200px] py-3.5 text-white font-semibold text-center rounded-xl mb-4', {
        'bg-blue-500 hover:bg-blue-600 transition shadow-md': !isDisabled,
        'bg-zinc-300 cursor-not-allowed': isDisabled,
      })}
      disabled={isDisabled}
      onClick={handleRedeem}
    >
      {buttonTitle}
    </button>
  );
};
