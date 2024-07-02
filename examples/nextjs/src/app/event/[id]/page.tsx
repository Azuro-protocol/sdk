'use client'
import { useParams } from 'next/navigation'
import { useGame, useActiveMarkets, useResolvedMarkets, type GameQuery, useGameStatus, useBetsSummaryBySelection } from '@azuro-org/sdk'
import { GameStatus } from '@azuro-org/sdk/utils';

import { GameInfo, GameMarkets } from '@/components'
import { useAccount } from 'wagmi';

type MarketsProps = {
  gameId: string
  gameStatus: GameStatus
}

const ResolvedMarkets: React.FC<MarketsProps> = ({ gameId, gameStatus }) => {
  const { address } = useAccount()
  const { groupedMarkets, loading } = useResolvedMarkets({ gameId })
  const { betsSummary } = useBetsSummaryBySelection({
    account: address!,
    gameId,
    gameStatus,
  })

  if (loading) {
    return <div>Loading...</div>
  }

  if (!groupedMarkets?.length) {
    return <div>Empty</div>
  }

  return (
    <div className="mt-12">
      <GameMarkets markets={groupedMarkets} betsSummary={betsSummary} isResult />
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
    return <ResolvedMarkets {...props} />
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
