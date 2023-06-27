# Data

## Hooks

Each data hook represents a logic wrapper over standard Apollo's `useQuery` hook. Explore [Apollo's docs](https://www.apollographql.com/docs/react/api/react/hooks#usequery) to understand what data the hooks return.

### `useGames`

[GraphQL Document](/src/docs/games.graphql)

#### Interface

Use this hook to fetch pre-match games.

```ts
useGames(props: Props): QueryResult<Data>

type Props = {
  filter?: {
    limit?: number
    offset?: number
    sportName?: string
  }
  orderBy?: Game_OrderBy
  orderDir?: OrderDirection
  cacheTime?: number
  withConditions?: boolean
}

type Data = { 
  games: Array<{ 
    id: string
    gameId: any
    title?: string | null
    startsAt: any
    sport: { 
      slug: string
      name: string 
    }
    league: {
      slug: string
      name: string
      country: { 
        slug: string
        name: string 
      } 
    }
    participants: Array<{ 
      image?: string | null
      name: string 
    }>
    conditions: Array<{
      id: string
      conditionId: any
      core: {
        address: string
        liquidityPool: {
          address: string
        }
      }
      outcomes: Array<{
        outcomeId: any
        odds: any
      }>
    }>
  }> 
}
```

#### Usage

```ts
import { useGames, Game_OrderBy, OrderDirection } from '@azuro-org/data'

const { loading, error, data } = useGames()

const games = data?.games
```

#### Props

- **filter.limit**: `{number}, optional` - limit the number of rows returned from a query.
- **filter.offset**: `{number}, optional` - omit a specified number of rows before the beginning of the result set.
- **filter.sportName**: `{string}, optional` - returns games from specific sport. Find the list of available sports [here](https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-v2/graphql?query=%7B%0A++sports+%7B%0A++++name%0A++%7D%0A%7D).
- **orderBy**: `{Game_OrderBy}, optional, default: Game_OrderBy.CreatedBlockTimestamp` - orders rows by passed rule.
- **orderDir**: `{OrderDirection}, optional` - order direction: asc, desc.
- **cacheTime**: `{number}, optional` - the frequency with which to update data, **measured in seconds**.
- **withConditions**: `{boolean}, optional, default: false` - if `true` the `conditions` will be added to query result.

**Note**:

Numerous completed games exist in the Subgraph database. Displaying these already-initiated games in the pre-match list is generally unnecessary. To filter out such games, we employ the `startsAt_gt` parameter in the GraphQL query variables. This only retrieves games for which the `startsAt` time is later than `now()`.

However, using the direct `now()` value for this parameter can be problematic as it can lead to frequent data re-fetches with each hook call. To mitigate this, we've introduced a caching mechanism that, by default, stores the results for 3 minutes. This caching duration can be modified by using the `cacheTime` parameter.

#### Custom query options

```ts
import { useQuery } from '@apollo/client'
import type { GamesDocument, GamesQueryResult, GamesQueryVariables } from '@azuro-org/data'

const options = {
  // your options
}

const { loading, error, data } = useQuery<GamesQueryResult, GamesQueryVariables>(GamesDocument, options)
```


### `useGame`

Use this hook to fetch specific game.

#### Interface

```ts
useGame(props: Props): QueryResult<Data>

type Props = {
  id: string
  withConditions?: boolean
}

type Data = { 
  game: { 
    id: string
    gameId: any
    title?: string | null
    startsAt: any
    sport: { 
      slug: string
      name: string 
    }
    league: {
      slug: string
      name: string
      country: { 
        slug: string
        name: string 
      } 
    }
    participants: Array<{ 
      image?: string | null
      name: string 
    }>
    conditions: Array<{
      id: string
      conditionId: any
      core: {
        address: string
        liquidityPool: {
          address: string
        }
      }
      outcomes: Array<{
        outcomeId: any
        odds: any
      }>
    }>
  } 
}
```

#### Usage

```ts
import { useGame } from '@azuro-org/data'

const { loading, error, data } = useGame({ id })

const game = data?.game
```

- **id**: `{string}, required` - the Subgraph `Game` entity's ID.
- **withConditions**: `{boolean}, optional, default: false` - if `true` the `conditions` will be added to query result.

**Note**:

`id` property is not same as `gameId`. Each game fetched using `useGames` hook contains the entity ID: 

```ts
const { loading, error, data } = useGames()

const firstGameID = data?.games[0]?.id
```

```ts
const { loading, error, data } = useGame({ id: firstGameID })
```


### `useConditions`

Use this hook to fetch conditions of specific game.

#### Interface

```ts
useConditions(props: Props): QueryResult<Data>

type Props = {
  gameEntityId: string
  filter?: {
    outcomeIds?: string[]
  }
}

type Data = {
  conditions: Array<{
    id: string
    conditionId: any
    core: {
      address: string
      liquidityPool: {
        address: string
      }
    }
    outcomes: Array<{
      outcomeId: any
      odds: any
    }>
  }>
}
```

#### Usage

```ts
const { loading, error, data } = useConditions({
  gameEntityId: '...',
})

const conditions = data?.game.conditions
```

- **gameEntityId**: `{string}, required` - the Subgraph `Game` entity's ID.
- **filter.outcomeIds**: `{string[]}, optional` - returns only conditions which contains the passed outcome ids.


### `useBets`

Use this hook to fetch bets history for specific bettor.

#### Interface

```ts
useBets(props: Props): QueryResult<Data>

type Props = {
  filter: {
    limit?: number
    offset?: number
    bettor: string
  }
  orderBy?: Bet_OrderBy
  orderDir?: OrderDirection
}

enum BetType {
  Express = 'Express',
  Ordinar = 'Ordinar'
}

enum BetStatus {
  Accepted = 'Accepted',
  Canceled = 'Canceled',
  Resolved = 'Resolved'
}

enum BetResult {
  Lost = 'Lost',
  Won = 'Won'
}

enum SelectionResult {
  Lost = 'Lost',
  Won = 'Won'
}

type Data = { 
  bets: Array<{ 
    id: string
    type: BetType
    amount: any
    status: BetStatus
    payout?: any | null
    potentialPayout: any
    result?: BetResult | null
    isRedeemed: boolean
    odds: any
    tokenId: any
    createdAt: any
    txHash: string
    core: {
      address: string 
    }
    selections: Array<{
      odds: any
      result?: SelectionResult | null
      outcome: {
        outcomeId: any
        condition: {
          conditionId: any
          game: {
            id: string
            gameId: any
            title?: string | null
            startsAt: any
            sport: {
              slug: string
              name: string 
            }
            league: {
              slug: string
              name: string
              country: {
                slug: string
                name: string 
              } 
            }
            participants: Array<{
              image?: string | null
              name: string 
            }> 
          } 
        } 
      } 
    }> 
  }> 
}
```

#### Usage

```ts
import { useBets } from '@azuro-org/data'

const { loading, error, data } = useBets({ 
  filter: {
    bettor: '0x...', // bettor address
  },
})

const bets = data?.bets
```

**Note**: 

The hook won't be called until `bettor` value is nullish.

#### Props

- **filter.limit**: `{number}, optional` - limit the number of rows returned from a query.
- **filter.offset**: `{number}, optional` - omit a specified number of rows before the beginning of the result set.
- **filter.bettor**: `{string}, required` - bettor address.
- **orderBy**: `{Bet_OrderBy}, optional, default: Bet_OrderBy.CreatedBlockTimestamp` - orders rows by passed rule.
- **orderDir**: `{OrderDirection}, optional` - order direction: asc, desc.

#### Custom query options

```ts
import { useQuery } from '@apollo/client'
import type { BetsDocument, BetsQueryResult, BetsQueryVariables } from '@azuro-org/data'

const options = {
  // your options
}

const { loading, error, data } = useQuery<BetsQueryResult, BetsQueryVariables>(BetsDocument, options)
```
