'use client'
import { useParams } from 'next/navigation'
import { useGame, useActiveMarkets, useResolvedMarkets, type GameQuery, useGameStatus } from '@azuro-org/sdk'
import { GameStatus } from '@azuro-org/sdk/utils';

import { GameInfo, GameMarkets } from '@/components'

type MarketsProps = {
  gameId: string
  gameStatus: GameStatus
}

const ResolvedMarkets: React.FC<Pick<MarketsProps, 'gameId'>> = ({ gameId }) => {
  const { prematchMarkets, liveMarkets, loading } = useResolvedMarkets({ gameId })

  if (loading) {
    return <div>Loading...</div>
  }

  if (!prematchMarkets?.length && !liveMarkets?.length) {
    return <div>Empty</div>
  }

  console.log(prematchMarkets, liveMarkets);

  return (
    <div className="space-y-10 mt-12">
      {
        Boolean(prematchMarkets?.length) && (
          <div>
            <div className="text-center text-xl font-bold mb-2">Prematch Results</div>
            <GameMarkets markets={prematchMarkets} isResult />
          </div>
        )
      }
      {
        Boolean(liveMarkets?.length) && (
          <div>
            <div className="text-center text-xl font-bold mb-2">Live Results</div>
            <GameMarkets markets={liveMarkets} isResult />
          </div>
        )
      }
    </div>
  )
}

const ActiveMarkets: React.FC<MarketsProps> = ({ gameId, gameStatus }) => {
  const { loading, markets } = useActiveMarkets({
    gameId,
    gameStatus,
    livePollInterval: 10000,
  })

  if (loading) {
    return <div>Loading...</div>
  }

  if (!markets) {
    return <div>Empty</div>
  }

  return <GameMarkets markets={markets} />
}

const Markets: React.FC<MarketsProps> = (props) => {
  const { gameId, gameStatus } = props

  if (gameStatus === GameStatus.Resolved) {
    return <ResolvedMarkets gameId={gameId} />
  }

  return (
    <div className="mt-12">
      <ActiveMarkets {...props} /> 
    </div>
  )
}

type ContentProps = {
  game: GameQuery['games'][0]
  isGameInLive: boolean
}

const Content: React.FC<ContentProps> = ({ game, isGameInLive }) => {
  const { status: gameStatus } = useGameStatus({
    startsAt: +game.startsAt,
    graphStatus: game.status,
    isGameExistInLive: isGameInLive,
  })

  return (
    <>
      <GameInfo game={game} />
      <Markets
        gameId={game.gameId}
        gameStatus={gameStatus}
      />
    </>
  )
}

export default function Game() {
  const params = useParams()

  const { loading, game, isGameInLive } = useGame({
    gameId: params.id as string,
  })

  if (loading) {
    return <div>Loading...</div>
  }

  if (!game) {
    return (
      <div>Game info not found</div>
    )
  }

  return (
    <Content game={game} isGameInLive={isGameInLive} />
  )
}
