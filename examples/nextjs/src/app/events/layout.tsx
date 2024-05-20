'use client'
import { SportsNavigation, Sport } from '@/components'
import { useParams } from 'next/navigation'
import { useSports, type UseSportsProps, Game_OrderBy, OrderDirection, useLive } from '@azuro-org/sdk'

const useData = () => {
  const params = useParams()
  const isTopPage = params.sport === 'top'
  const { isLive } = useLive()

  const props: UseSportsProps = isTopPage ? {
    gameOrderBy: Game_OrderBy.Turnover,
    filter: {
      limit: 10,
    },
    isLive,
  } : {
    gameOrderBy: Game_OrderBy.StartsAt,
    orderDir: OrderDirection.Asc,
    filter: {
      sportSlug: params.sport as string,
      countrySlug: params.country as string,
      leagueSlug: params.league as string,
    },
    isLive,
  }

  const { loading, sports } = useSports(props)

  return {
    sports,
    loading,
  }
}

export default function EventsLayout() {
  const { loading, sports } = useData()

  return (
    <>
      <SportsNavigation />
      {
        loading ? (
          <div>Loading...</div>
        ) : (
          <div>
            {
              sports.map((sport) => (
                <Sport key={sport.slug} sport={sport} />
              ))
            }
          </div>
        )
      }
    </>
  )
}
