'use client'
import { useParams } from 'next/navigation'
import { useGame, useGameMarkets } from '@azuro-org/sdk'
import { GameInfo, GameMarkets } from '@/components'
import { type Chain, useNetwork } from 'wagmi'


const Info = () => {
  const params = useParams()
  const { chains } = useNetwork()

  const { loading, data } = useGame({
    id: params.id as string,
  })

  if (loading) {
    return <div>Loading...</div>
  }

  return <GameInfo game={data?.game} />
}

const Markets = () => {
  const params = useParams()

  const { loading, markets } = useGameMarkets({
    gameEntityId: params.id as string,
  })

  if (loading) {
    return <div>Loading...</div>
  }

  return <GameMarkets markets={markets!} />
}

export default function Game() {

  return (
    <>
      <Info />
      <Markets />
    </>
  )
}
