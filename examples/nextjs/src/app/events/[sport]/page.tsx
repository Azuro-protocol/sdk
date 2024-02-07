'use client'
import { useParams } from 'next/navigation'
import { useGames, useSports, type UseSportsProps, Game_OrderBy, OrderDirection } from '@azuro-org/sdk'
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
          sportSlug: params.sport,
        },
      }

  return useGames(props)
}

const useSportsData = () => {
  const params = useParams()

  const props: UseSportsProps = params.sport === 'top' ? {
    gameOrderBy: Game_OrderBy.Turnover,
    filter: {
      limit: 10,
    }
  } : {
    gameOrderBy: Game_OrderBy.StartsAt,
    orderDir: OrderDirection.Asc,
    filter: {
      sportSlug: params.sport,
    }
  }

  return useSports(props)
}

export default function Events() {
  const { loading, data } = useData()
  const {data: sports} = useSportsData()

  console.log(sports, 'sports');

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
