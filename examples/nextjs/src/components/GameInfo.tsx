import dayjs from 'dayjs'
import { type GameQuery } from '@azuro-org/sdk'
import { ParticipantLogo } from '@/components'

type Props = {
  game: GameQuery['game']
}

export function GameInfo(props: Props) {
  const { title, sport, league, participants, startsAt } = props.game!

  return (
    <div className="flex flex-col items-center pt-6 pb-8 border border-gray-300 rounded-lg">
      <div className="flex flex-col items-center text-md">
        <div>{sport.name}</div>
        <div className="mt-2 text-gray-500">
          {league.country.name} &middot; {league.name}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr]">
        <ParticipantLogo {...participants[0]} />
        <div className="mx-5 pt-7 text-md text-gray-500">
          {dayjs(startsAt * 1000).format('DD MMM HH:mm')}
        </div>
        <ParticipantLogo {...participants[1]} />
      </div>
    </div>
  )
}
