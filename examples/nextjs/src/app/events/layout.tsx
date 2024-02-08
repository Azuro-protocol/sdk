'use client'
import { SportsNavigation, Sport } from '@/components'
import { useParams } from 'next/navigation'
import { useSports, type UseSportsProps, Game_OrderBy, OrderDirection } from '@azuro-org/sdk'

const useData = () => {
  const params = useParams()
  const isTopPage = params.sport === 'top'

  const props: UseSportsProps = isTopPage ? {
    gameOrderBy: Game_OrderBy.Turnover,
    filter: {
      limit: 10,
    }
  } : {
    gameOrderBy: Game_OrderBy.StartsAt,
    orderDir: OrderDirection.Asc,
    filter: {
      sportSlug: params.sport,
      countrySlug: params.country,
      leagueSlug: params.league,
    }
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
