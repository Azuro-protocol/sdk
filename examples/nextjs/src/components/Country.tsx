'use client'
import { SportsQuery } from '@azuro-org/sdk'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import cx from 'clsx'

import { League } from './Leaglue'
import { CountryFlag } from './CountryFlag/CountryFlag'

type CountryProps = {
  className?: string
  sportSlug: string
  country: SportsQuery['sports'][0]['countries'][0]
}

export function Country(props: CountryProps) {
  const { className, sportSlug, country } = props
  const { leagues } = country

  const params = useParams()

  const isCountryPage = params.country
  const isLeaguePage = params.league
  
  return (
    <div
      className={cx(className, {
        "p-4 bg-zinc-100 rounded-3xl": !isCountryPage && !isLeaguePage
      })}>
        {
          !isLeaguePage && (
            <div className="flex items-center mb-2">
              <CountryFlag countryName={country.name} />
              <Link 
                className={cx("ml-1 hover:underline", {
                  "text-md font-medium": !isCountryPage,
                  "text-lg font-bold": isCountryPage
                })} 
                href={`/events/${sportSlug}/${country.slug}`}
              >
                {country.name}
              </Link>
            </div>
          )
        }
        {
          leagues.map(league => (
            <League 
              key={league.slug}
              className="mt-2 first-of-type:mt-0"
              league={league} 
              sportSlug={sportSlug} 
              countryName={country.name}
              countrySlug={country.slug}
            />
          ))
        }
    </div>
  )
}
