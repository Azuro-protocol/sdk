'use client'
import { useParams } from 'next/navigation'
import { useGame, useGameMarkets } from '@azuro-org/sdk'
import { GameInfo, GameMarkets } from '@/components'


const Info = () => {
  const params = useParams()

  const { loading, data } = useGame({
    gameId: params.id as string,
  })

  if (loading) {
    return <div>Loading...</div>
  }

  if (!data) {
    return (
      <div>Game info not found</div>
    )
  }

  return <GameInfo game={data} />
}

const Markets = () => {
  const params = useParams()

  const { loading, data } = useGameMarkets({
    gameId: params.id as string,
  })

  if (loading) {
    return <div>Loading...</div>
  }

  if (!data) {
    return null
  }

  return <GameMarkets markets={data!} />
}

export default function Game() {

  return (
    <>
      <Info />
      <Markets />
    </>
  )
}
