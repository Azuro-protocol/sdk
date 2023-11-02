'use client'
import { useBets, OrderDirection } from '@azuro-org/sdk'
import { useAccount } from 'wagmi';
import { BetCard } from '@/components';

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
    <>
      {
        data.map(bet => (
          <BetCard key={bet.tokenId} bet={bet} />
        ))
      }
    </>
  )
}
