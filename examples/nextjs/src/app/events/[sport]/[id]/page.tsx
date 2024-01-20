'use client'
import { useParams } from 'next/navigation'
import { useGame, useGameMarkets, type GameQuery, useGameStatus, GameStatus } from '@azuro-org/sdk'
import { GameInfo, GameMarkets } from '@/components'


type InfoProps = {
  game: GameQuery['games'][0]
}

const Info: React.FC<InfoProps> = ({ game }) => {
  return <GameInfo game={game} />
}

type MarketsProps = {
  gameId: string
  gameStatus: GameStatus
}

const Markets: React.FC<MarketsProps> = ({ gameId, gameStatus }) => {
  const { loading, data } = useGameMarkets({
    gameId,
    gameStatus,
  })

  if (loading) {
    return <div>Loading...</div>
  }

  if (!data) {
    return null
  }

  return <GameMarkets markets={data!} />
}

type ContentProps = {
  game: GameQuery['games'][0]
  isGameInLive: boolean
}

const Content: React.FC<ContentProps> = ({ game, isGameInLive }) => {
  const { status: gameStatus } = useGameStatus({
    gameId: game.gameId,
    startsAt: +game.startsAt,
    isGameExistInLive: isGameInLive,
    initialStatus: game.status,
  })

  return (
    <>
      <Info game={game} />
      <Markets
        gameId={game.gameId}
        gameStatus={gameStatus}
      />
    </>
  )
}

export default function Game() {
  const params = useParams()

  const { loading, data, isGameInLive } = useGame({
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

  return (
    <Content game={data} isGameInLive={isGameInLive} />
  )
}
