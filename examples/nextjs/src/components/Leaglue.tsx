'use client'
import { GamesQuery, SportsQuery, useGameStatus, useGameMarkets, useLive } from '@azuro-org/sdk';
import Link from 'next/link';
import cx from 'clsx';
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'

import { CountryFlag } from './CountryFlag/CountryFlag';
import { OutcomeButton } from './index';


type GameProps = {
  className?: string
  game: GamesQuery['games'][0]
}

function Game(props: GameProps) {
  const { className, game } = props
  const { gameId, title, startsAt, status: graphStatus } = game

  const { isLive } = useLive()
  const { status } = useGameStatus({
    graphStatus,
    startsAt: +startsAt,
    isGameExistInLive: isLive,
  })
  const { markets } = useGameMarkets({
    gameStatus: status,
    gameId,
  })

  return (
    <div className={cx(className, "p-2 bg-zinc-200 rounded-lg flex items-center justify-between")}>
      <div className='max-w-[220px] w-full'>
        <Link 
          className="text-sm mb-2 hover:underline block whitespace-nowrap overflow-hidden text-ellipsis w-full" 
          href={`/event/${gameId}`}
        >
          {title}
        </Link>
        <div>{dayjs(+startsAt * 1000).format('DD MMM HH:mm')}</div>
      </div>
      {
        Boolean(markets?.[0]?.outcomeRows[0]) && (
          <div className="min-w-[500px]">
            <div className="text-center">{markets![0].name}</div>
            <div className="flex items-center">
              {
                markets![0].outcomeRows[0].map((outcome) => (
                  <OutcomeButton
                    className="ml-2 first-of-type:ml-0"
                    key={outcome.selectionName}
                    outcome={outcome}
                  />
                ))
              }
            </div>
          </div>
        )
      }
      <Link 
        className="text-md p-2 rounded-lg bg-zinc-100 hover:underline" 
        href={`/event/${gameId}`}
      >
        All Markets =&gt;
      </Link>
    </div>
  )
}

type LeagueProps = {
  className?: string
  sportSlug: string
  countryName: string
  countrySlug: string
  league: SportsQuery['sports'][0]['countries'][0]['leagues'][0]
}

export function League(props: LeagueProps) {
  const { className, sportSlug, countryName, countrySlug, league } = props
  const { games } = league

  const params = useParams()

  const isLeaguePage = params.league
  
  return (
    <div
      className={cx(className, {
        "p-4 bg-zinc-50 rounded-md": !isLeaguePage
      })}>
        <div className={cx("flex items-center mb-2", {
          "text-sm": !isLeaguePage,
          "text-lg font-bold": isLeaguePage
        })}>
          {
            isLeaguePage && (
              <>
                <Link 
                  className="hover:underline w-fit flex items-center"
                  href={`/events/${sportSlug}/${countrySlug}`}
                >
                  <CountryFlag countryName={countryName} />
                  <div className="ml-2">{countryName}</div>
                </Link>
                <div className="mx-2">&middot;</div>
              </>
            )
          }
          <Link 
            className="hover:underline w-fit"
            href={`/events/${sportSlug}/${countrySlug}/${league.slug}`}
          >
            {league.name}
          </Link>
        </div>
        {
          games.map(game => (
            <Game 
              key={game.gameId}
              className="mt-2 first-of-type:mt-0"
              game={game} 
            />
          ))
        }
    </div>
  )
}
