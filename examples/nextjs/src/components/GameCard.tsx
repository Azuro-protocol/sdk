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
      className="p-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
      href={`/games/${id}`}
    >
      <div className="flex justify-between text-sm">
        <span>{sport.name}</span>
        <span>{dayjs(startsAt * 1000).format('DD MMM HH:mm')}</span>
      </div>
      <div className="mt-2 text-sm text-gray-400">
        {league.country.name} &middot; {league.name}
      </div>
      <div className="mt-3 space-y-1">
        {
          participants.map(({ image, name }) => (
            <div key={name} className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 mr-2 border border-gray-300 rounded-full">
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
