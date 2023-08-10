'use client'
import { usePlaceBet, type GameQuery } from '@azuro-org/sdk'
import { GameInfo } from '@/components'

type Props = {
  game: GameQuery['game']
  outcome: any
  closeModal: any
}

export default function PlaceBetModal(props: Props) {
  const { game, outcome, closeModal } = props

  const { submit } = usePlaceBet({
    amount: 10,
    minOdds: 1.5,
    deadline: 60, // 1 min
    affiliate: '0x...', // your (affiliate) wallet address
    selections: [
      {
        conditionId: '486903008559711340',
        outcomeId: '29',
      },
    ],
  })

  const placeBet = () => {
    submit()
  }

  const amountsNode = (
    <div className="mt-4 pt-4 border-t border-gray-300 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-md text-gray-400">Wallet balance</span>
        <span className="text-md font-semibold">-</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-md text-gray-400">Bet amount</span>
        <input
          className="w-[121px] py-2 px-4 border border-gray-400 text-md text-right font-semibold rounded-md"
          type="number"
          placeholder="Bet amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>
    </div>
  )

  const button = !isRightChain ? (
    <div className="mt-6 py-2.5 text-center bg-red-200 rounded-md">
      Switch network in your wallet to <b>Polygon</b>
    </div>
  ) : (
    <button
      className="button w-full mt-6 py-2.5 text-center"
      disabled={isAllowanceFetching || isApproving}
      onClick={isApproveRequired ? approve : placeBet}
    >
      {isApproveRequired ? (isApproving ? 'Approving...' : 'Approve') : 'Place bet'}
    </button>
  )

  const marketName = getMarketName({ outcomeId: outcome.outcomeId, dictionaries })

  return (
    <div
      className="fixed top-0 left-0 z-50 w-full h-full flex items-center justify-center bg-black bg-opacity-20"
      onClick={closeModal}
    >
      <div
        className="w-[400px] bg-white overflow-hidden rounded-xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <GameInfo game={game} />
        <div className="pt-4 px-6 pb-6">
          <div className="grid grid-cols-[auto_1fr] gap-y-3 mt-2 text-md">
            <span className="text-gray-400">Market</span>
            <span className="text-right font-semibold">{marketName}</span>
            <span className="text-gray-400">Selection</span>
            <span className="text-right font-semibold">{outcome.selectionName}</span>
            <span className="text-gray-400">Odds</span>
            <span className="text-right font-semibold">{outcome.odds}</span>
          </div>
          {amountsNode}
          {button}
        </div>
      </div>
    </div>
  )
}
