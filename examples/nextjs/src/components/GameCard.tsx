import { GamesQuery } from '@azuro-org/sdk'
import Link from 'next/link'
import dayjs from 'dayjs'

type Props = {
  game: GamesQuery['games'][0]
}

export function GameCard(props: Props) {
  const { id, sport, league, participants, startsAt } = props.game

  return (
    <Link
      className="p-4 bg-zinc-50 rounded-3xl hover:bg-zinc-100 transition"
      href={`/events/${sport.slug}/${id}`}
    >
      <div className="flex justify-between text-sm">
        <span>{sport.name}</span>
        <span>{dayjs(startsAt * 1000).format('DD MMM HH:mm')}</span>
      </div>
      <div className="mt-2 text-sm text-zinc-400">
        {league.country.name} &middot; {league.name}
      </div>
      <div className="mt-3 space-y-1">
        {
          participants.map(({ image, name }) => (
            <div key={name} className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 mr-2 border border-zinc-300 rounded-full">
                <img className="w-4 h-4" src={image || undefined} alt="" />
              </div>
              <span className="text-md">{name}</span>
            </div>
          ))
        }
      </div>
    </Link>
  )
}
