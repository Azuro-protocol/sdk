'use client'
import { usePrematchBets, useLiveBets, OrderDirection } from '@azuro-org/sdk'
import { useAccount } from 'wagmi';
import { BetCard, RedeemAll } from '@/components';
import { useMemo } from 'react';


export default function Bets() {
  const { address } = useAccount()

  const props = {
    filter: {
      bettor: address!,
    },
    orderDir: OrderDirection.Desc,
  }

  const { loading: isPrematchLoading, bets: prematchBets } = usePrematchBets(props)
  const { loading: isLiveLoading, bets: liveBets } = useLiveBets(props)

  const bets = useMemo(() => {
    return [...liveBets, ...prematchBets].sort((betA, betB) => betB.createdAt - betA.createdAt)
  }, [ prematchBets, liveBets ])

  if (isLiveLoading || isPrematchLoading) {
    return <div>Loading...</div>
  }

  if (!prematchBets?.length && !liveBets?.length) {
    return <div>You don't have bets yet</div>
  }

  return (
    <div>
      <RedeemAll bets={bets} />
      {
        bets.map(bet => (
          <BetCard key={`${bet.createdAt}-${bet.tokenId}`} bet={bet} />
        ))
      }
    </div>
  )
}
