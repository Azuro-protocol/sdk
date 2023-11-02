import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { type Address } from 'wagmi';
import { BetsDocument, BetsQueryResult, BetsQueryVariables } from '../docs/bets'
import { Bet_OrderBy, OrderDirection } from '../types'


export type UseBetsProps = {
  filter: {
    bettor: Address
    limit?: number
    offset?: number
  }
  orderBy?: Bet_OrderBy
  orderDir?: OrderDirection
}

export const useBets = (props: UseBetsProps) => {
  const {
    filter,
    orderBy = Bet_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Asc,
  } = props

  const options = useMemo(() => {
    const variables: BetsQueryVariables = {
      first: filter.limit,
      skip: filter.offset,
      orderBy,
      orderDirection: orderDir,
      where: {
        actor: filter.bettor,
      },
    }

    return {
      variables,
      ssr: false,
      skip: !filter.bettor,
    }
  }, [
    filter.limit,
    filter.offset,
    filter.bettor,
    orderBy,
    orderDir,
  ])

  return useQuery<BetsQueryResult, BetsQueryVariables>(BetsDocument, options)
}
