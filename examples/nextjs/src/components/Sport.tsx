'use client'
import { SportsQuery } from '@azuro-org/sdk'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import cx from 'clsx'

import { Country } from './Country'


type SportProps = {
  sport: SportsQuery['sports'][0]
}

export function Sport(props: SportProps) {
  const { sport } = props
  const { countries } = sport
  const params = useParams()

  const isSportPage = params.sport !== 'top'

  return (
    <div
      className={cx({
        "p-4 bg-zinc-50 rounded-3xl mt-2 first-of-type:mt-0": !isSportPage
      })}
    >
      {
        !isSportPage && (
          <Link 
            className="text-lg mb-2 hover:underline font-bold" 
            href={`/events/${sport.slug}`}
          >
            {sport.name}
          </Link>
        )
      }
      {
        countries.map(country => (
          <Country 
            key={country.slug} 
            className="mt-2 first-of-type:mt-0" 
            country={country} 
            sportSlug={sport.slug} 
          />
        ))
      }
    </div>
  )
}
