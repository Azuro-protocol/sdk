'use client'
import { useParams } from 'next/navigation'
import { useGames, Game_OrderBy } from '@azuro-org/sdk'
import { GameCard, SportsNavigation } from '@/components'


const useData = () => {
  const params = useParams()

  const props =
    params.sport === 'top'
      ? {
        orderBy: Game_OrderBy.Turnover,
        filter: {
          limit: 6,
        },
      }
      : {
        filter: {
          sportSlug: params.sport as string,
        },
      }

  return useGames(props)
}

export default function Events() {
  const { loading, data } = useData()

  return (
    <>
      <SportsNavigation />
      {
        loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {
              data?.games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))
            }
          </div>
        )
      }
    </>
  )
}
