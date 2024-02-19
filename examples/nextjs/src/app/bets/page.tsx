'use client'
import { useBets, OrderDirection } from '@azuro-org/sdk'
import { useAccount } from 'wagmi'
import { BetCard, RedeemAll } from '@/components'

const useData = () => {
  const { address } = useAccount()

  const props = {
    filter: {
      bettor: address!,
    },
    orderDir: OrderDirection.Desc,
  }

  return useBets(props)
}

export default function Bets() {
  const { loading, data } = useData()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!data?.length) {
    return <div>You don't have bets yet</div>
  }

  return (
    <div>
      <RedeemAll bets={data} />
      {
        data.map(bet => (
          <BetCard key={`${bet.createdAt}-${bet.tokenId}`} bet={bet} />
        ))
      }
    </div>
  )
}
