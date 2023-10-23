# SDK

## Installation

```
npm install @azuro-org/sdk
```

#### Peer Dependencies

```
@apollo/client^3.8.0-beta.3 
@apollo/experimental-nextjs-app-support@^0.2.1
graphql@^16.6.0
react@^18.2.0
view^0.3.50
wagmi@^1.3.8
```


## Utils

### `calcMindOdds`

Calculates the minimum odds value at which the bet can be placed. If the current odds value is lower than the specified value, the bet cannot be placed and will be rejected by the contract.

```ts
import { calcMindOdds } from '@azuro-org/sdk'

const minOdds = calcMindOdds({ 
  odds: 1.17,
  slippage: 5, // 5% 
})
```


### `calcOdds`

Returns actual odds value for specific outcomeId (on specific condition and chain)

```ts
import { calcOdds } from '@azuro-org/sdk'

const odds = await calcOdds({
  chainId: polygon.id,
  conditionId: '486903008559711340',
  outcomeId: '29',
  amount: 10, // 10 USDT
})
```


### `watchOddsChange`

Watches for odds change

```ts
import { watchOddsChange } from '@azuro-org/sdk'

const unwatch = watchOddsChange({
  chainId: polygon.id,
  conditionIds: [
    '486903008559711340',
    '486903008123712788',
  ],
  batch: true,
  onLogs: (logs) => {
    console.log(logs)
  },
})

unwatch() // to stop watching
```

#### Props

- `chainId: number`
- `conditionIds: string[]`
- `batch: boolean` - https://viem.sh/docs/clients/transports/http.html#batch-json-rpc
- `onLogs: (logs: Log[]) => void`


## Hooks

### `useChain`

```ts
import { useChain } from '@azuro-org/sdk'

const { chain, contracts, betToken } = useChain()
```

#### Return Value

```ts
import { type Chain } from 'viem/chains'

{
  chain: Chain
  contracts: {
    lp: {
      address: `0x${string}`
      abi: AbiType
    }
    prematchCore: {
      address: `0x${string}`
      abi: AbiType
    }
    prematchComboCore: {
      address: `0x${string}`
      abi: AbiType
    }
  }
  betToken: {
    address: `0x${string}`
    symbol: string
    decimals: number
    isNative: boolean
  }
}
```


### `useCalcOdds`

```ts
import { useCalcOdds } from '@azuro-org/sdk'

const { isLoading, data, error } = useCalcOdds({
  amount: 10,
  selections: [
    {
      conditionId: '486903008559711340',
      outcomeId: '29',
    },  
  ],
})

const { conditionsOdds, totalOdds } = data
```


### `usePlaceBet`

Doesn't contain `minOdds` calculation because it's based on current odds values and slippage. We should be sure that 
odds values are updated, if usePlaceBet will contain the logic of calculation when there should be not necessary call for 
odds values fetching. This should be done only in client app, not in lib itself.

```ts
import { usePlaceBet } from '@azuro-org/sdk'

const {
  isAllowanceLoading,
  isApproveRequired,
  isOddsLoading,
  conditionsOdds,
  totalOdds,
  submit,
  approveTx,
  betTx,
} = usePlaceBet({
  amount: 10,
  minOdds: 1.5,
  deadline: 60, // 1 min
  affiliate: '0x...', // your (affiliate) wallet address
  selections: [
    {
      conditionId: '486903008559711340',
      outcomeId: '29',
    },
  ],
})

submit()
```

#### Hook Props

```ts
{
  amount: number
  minOdds: number
  deadline?: number
  affiliate: `0x${string}`
  selections: {
    conditionId: string | number
    outcomeId: string | number
  }[]
}
```

#### Return Value

```ts
{
  isAllowanceLoading: boolean
  isApproveRequired: boolean
  submit: () => Promise<Receipt>
  approveTx: {
    isPending: boolean
    isProcessing: boolean
    data: WriteContractResult | null
    error: Error | null
  }
  betTx: {
    isPending: boolean
    isProcessing: boolean
    data: WriteContractResult | null
    error: Error | null
  }
}
```





## Hooks

Each data hook represents a logic wrapper over standard Apollo's `useQuery` hook. Explore [Apollo's docs](https://www.apollographql.com/docs/react/api/react/hooks#usequery) to understand what data the hooks return.

### `useGames`

Fetch pre-match games.

#### Usage

```ts
import { useGames, Game_OrderBy, OrderDirection } from '@azuro-org/data'

const { loading, error, data } = useGames(props)

const games = data?.games
```

#### Props (are optional)

- **filter.limit**: `{number}, optional` - limit the number of rows returned from a query.
- **filter.offset**: `{number}, optional` - omit a specified number of rows before the beginning of the result set.
- **filter.sportName**: `{string}, optional` - returns games from specific sport. Find the list of available sports [here](https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-v2/graphql?query=%7B%0A++sports+%7B%0A++++name%0A++%7D%0A%7D).
- **orderBy**: `{Game_OrderBy}, optional, default: Game_OrderBy.CreatedBlockTimestamp` - orders rows by passed rule.
- **orderDir**: `{OrderDirection}, optional` - order direction: asc, desc.
- **cacheTime**: `{number}, optional` - the frequency with which to update data, **measured in seconds**.
- **withConditions**: `{boolean}, optional, default: false` - if `true` the `conditions` will be added to query result.

#### Note

Numerous completed games exist in the Subgraph database. Displaying these already-initiated games in the pre-match list is generally unnecessary. To filter out such games, we employ the `startsAt_gt` parameter in the GraphQL query variables. This only retrieves games for which the `startsAt` time is later than `now()`.

However, using the direct `now()` value for this parameter can be problematic as it can lead to frequent data re-fetches with each hook call. To mitigate this, we've introduced a caching mechanism that, by default, stores the results for 3 minutes. This caching duration can be modified by using the `cacheTime` parameter.

#### Custom query options

To accommodate additional arguments within your GraphQL query, the optimal approach is to create a custom hook. This can be achieved by leveraging the fundamental Apollo `useQuery` hook as your starting point.

```ts
import { useQuery } from '@apollo/client'
import type { GamesDocument, GamesQueryResult, GamesQueryVariables } from '@azuro-org/data'

const options = {
  // your options
}

const { loading, error, data } = useQuery<GamesQueryResult, GamesQueryVariables>(GamesDocument, options)
```

<details>
<summary><h4>Interface</h4></summary>

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
</details>

---

### `useGame`

Fetch specific game data.

#### Usage

```ts
import { useGame } from '@azuro-org/data'

const { loading, error, data } = useGame(props)

const game = data?.game
```

#### Props

- **id**: `{string}, required` - the Subgraph `Game` entity's ID.
- **withConditions**: `{boolean}, optional, default: false` - if `true` the `conditions` will be added to query result.

#### Note

`id` property is not same as `gameId`. Each game fetched using `useGames` hook contains the entity ID:

```ts
const { loading, error, data } = useGames()

const firstGameID = data?.games[0]?.id
```

```ts
const { loading, error, data } = useGame({ id: firstGameID })
```

<details>
<summary><h4>Interface</h4></summary>

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
</details>

---

### `useConditions`

Fetch the conditions of specific game.

#### Usage

```ts
const { loading, error, data } = useConditions(props)

const conditions = data?.game.conditions
```

#### Props

- **gameEntityId**: `{string}, required` - the Subgraph `Game` entity's ID.
- **filter.outcomeIds**: `{string[]}, optional` - returns only conditions which contains the passed outcome ids.

<details>
<summary><h4>Interface</h4></summary>

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
</details>

---

### `useBets`

Fetch bets history for specific bettor.

#### Usage

```ts
import { useBets } from '@azuro-org/data'

const { loading, error, data } = useBets(props)

const bets = data?.bets
```

#### Note

The hook won't be called until `bettor` value is nullish.

#### Props

- **filter.limit**: `{number}, optional` - limit the number of rows returned from a query.
- **filter.offset**: `{number}, optional` - omit a specified number of rows before the beginning of the result set.
- **filter.bettor**: `{string}, required` - bettor address.
- **orderBy**: `{Bet_OrderBy}, optional, default: Bet_OrderBy.CreatedBlockTimestamp` - orders rows by passed rule.
- **orderDir**: `{OrderDirection}, optional` - order direction: asc, desc.

#### Custom query options

To accommodate additional arguments within your GraphQL query, the optimal approach is to create a custom hook. This can be achieved by leveraging the fundamental Apollo `useQuery` hook as your starting point.

```ts
import { useQuery } from '@apollo/client'
import { BetsDocument, BetsQueryResult, BetsQueryVariables } from '@azuro-org/sdk'

const options = {
  // your options
}

const { loading, error, data } = useQuery<BetsQueryResult, BetsQueryVariables>(BetsDocument, options)
```

<details>
<summary><h4>Interface</h4></summary>

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
</details>

