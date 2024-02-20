'use client'
import { useSportsNavigation } from '@azuro-org/sdk'
import { ActiveLink } from '@/components'


export function SportsNavigation() {
  const { loading, sports } = useSportsNavigation({
    withGameCount: true,
  })

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="w-full mb-8 overflow-hidden">
      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="flex space-x-1">
          <ActiveLink
            className="py-2 px-4 bg-zinc-100 whitespace-nowrap rounded-full"
            activeClassName="!bg-purple-200"
            href="/events/top"
          >
            Top
          </ActiveLink>
          {
            [ ...sports || [] ]
              .sort((a, b) => b.games!.length - a.games!.length)
              .map(({ slug, name, games }) => (
                <ActiveLink
                  key={slug}
                  className="flex items-center py-2 px-4 bg-zinc-100 whitespace-nowrap rounded-full"
                  activeClassName="!bg-purple-200"
                  href={`/events/${slug}`}
                >
                  <span>{name}</span>
                  {
                    games && (
                      <span className="pl-1.5 text-zinc-400">{games.length}</span>
                    )
                  }
                </ActiveLink>
              ))
          }
          <div className="flex-none w-3 h-4" />
        </div>
      </div>
    </div>
  )
}
