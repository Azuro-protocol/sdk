'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import { useGame } from '@azuro-org/sdk'
import { getMarketName } from '@azuro-org/dictionaries'
import { GameInfo } from '@/components'
import { AmountInput } from './AmountInput'
import { SubmitButton } from './SubmitButton'


type Props = {
  outcome: any
  closeModal: any
}

export function PlaceBetModal(props: Props) {
  const { outcome, closeModal } = props

  const params = useParams()
  const { data } = useGame({ id: params.id })
  const [ amount, setAmount ] = useState('')
  const [ isSuccess, setSuccess ] = useState(false)

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
        {
          isSuccess ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <CheckBadgeIcon className="w-28 h-28 text-purple-500" />
              <div className="mt-5 text-2xl font-semibold">Success!</div>
            </div>
          ) : (
            <>
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
                <AmountInput
                  amount={amount}
                  onChange={setAmount}
                />
                <SubmitButton
                  amount={amount}
                  outcome={outcome}
                  onSuccess={() => {
                    console.log(333)
                    setSuccess(true)
                  }}
                />
              </div>
            </>
          )
        }
      </div>
    </div>
  )
}
