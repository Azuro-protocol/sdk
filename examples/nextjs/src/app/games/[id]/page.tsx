'use client'
import { useParams } from 'next/navigation'
import { useGame } from '@azuro-org/sdk'
import { GameInfo, GameMarkets } from '@/components'

export default function Game() {
  const params = useParams()

  const { loading, data } = useGame({
    id: params.id as string,
  })

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <main className="container pt-5 pb-10">
      <GameInfo game={data?.game} />
      {/*<GameMarkets game={data?.game} markets={markets} />*/}
    </main>
  )
}
