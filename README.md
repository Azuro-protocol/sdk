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

#### Usage

```ts
import { calcMindOdds } from '@azuro-org/sdk'

const minOdds = calcMindOdds({ 
  odds: 1.17,
  slippage: 5, // 5% 
})
```

---

### `getGameStatus`

Returns detailed game status based on game's status from graph and start date

#### Usage

```ts
import { getGameStatus } from '@azuro-org/sdk'

const { status, startsAt } = game // game's data from graph

const gameStatus = getGameStatus({ 
  graphGameStatus: status,
  startsAt,
})
```

#### Props

- `graphGameStatus: GameStatus` // game's status from graph
- `startsAt: number`

#### Return Value

```ts
enum GameStatus {
  Preparing,
  Live,
  PendingResolution,
  Resolved,
  Canceled,
  Paused,
}
```

---

### `getBetStatus`

Returns detailed bet status based on bet's status from graph and result and games in a bet

#### Usage

```ts
import { getBetStatus, type Bet } from '@azuro-org/sdk'

const { games, status, isWin, isLose } = bet as Bet // bet's data

const betStatus = getBetStatus({
  graphGameStatus: status,
  games,
  win: isWin,
  lose: isLose,
})
```

#### Props

- `graphGameStatus: BetStatus` // bet's status from graph
- `games: GameQuery['games'][]`
- `win: boolean`
- `lose: boolean`

#### Return Value

```ts
enum BetStatus {
  Accepted,
  Live,
  PendingResolution,
  Canceled,
  Won,
  Lost,
}
```

## Hooks

### `useChain`

Context for storing and providing application chain

#### Usage

```ts
import { useChain } from '@azuro-org/sdk'

const { appChain, walletChain, contracts, betToken, isRightNetwork, setAppChainId } = useChain()
```

#### Return Value

```ts
import { type Chain } from 'viem/chains'

{
  appChain: Chain
  walletChain: Chain
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
  }
  isRightNetwork: boolean
  setAppChainId: (chainId: ChainId) => void
}
```

---

### `useBetTokenBalance` and `useNativeBalance`
returns balance based on appChain

#### Usage

```ts
import { useBetTokenBalance } from '@azuro-org/sdk'

const { loading, balance, rawBalance, error } = useBetTokenBalance()
const { loading, balance, rawBalance, error } = useNativeBalance()
```

---

### `useCalcOdds`

Used for calculating odds for bet with provided selections

#### Usage

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

---

### `usePlaceBet`

```ts
import { usePrepareBet } from '@azuro-org/sdk'

const {
  totalOdds,
  approveTx,
  betTx,
  submit,
  isApproveRequired,
  isOddsLoading,
  isAllowanceLoading,
} = usePrepareBet({
  amount: '10', // 10 USDT
  slippage: 5, // 5%
  affiliate: '0x0000000000000000000000000000000000000000', // your affiliate address
  selections: [
    {
      conditionId: outcome.conditionId,
      outcomeId: outcome.outcomeId,
    },
  ],
})

submit()
```

#### Hook Props

```ts
{
  amount: string
  slippage: number
  affiliate: Address
  selections: {
    conditionId: string | bigint
    outcomeId: string | bigint
  }[]
  deadline?: number
  onSuccess?(receipt: TransactionReceipt): void
  onError?(err?: Error): void
}
```

#### Return Value

```ts
{
  isAllowanceLoading: boolean
  isApproveRequired: boolean
  isOddsLoading: boolean
  conditionsOdds: number[]
  totalOdds: number
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

## Watch and Subscribe Hooks

### `useConditionStatusWatcher` and `useConditionStatus`

Used for watch condition's status changes and subscribe to them

#### Usage

Initialize watcher in the root of your app

```ts
import { useConditionStatusWatcher } from '@azuro-org/sdk'

export function Watchers() {
  useConditionStatusWatcher()

  return null
}
```

Subscribe to changes in your outcome

```ts
const status = useConditionStatus({
  conditionId: outcome.conditionId,
  initialStatus: outcome.status,
})

const isDisabled = status !== ConditionStatus.Created
```

#### useConditionStatus Props

```ts
{
  conditionId: string | bigint
  initialStatus?: ConditionStatus
}
```

#### useConditionStatus Return Value

Returns condition status (defaults to `ConditionStatus.Created`).
Value may be changed to `ConditionStatus.Paused` or `ConditionStatus.Created` by event from contract.

```ts
// Auto-generated from graphql:
enum ConditionStatus {
  Canceled = 'Canceled',
  Created = 'Created',
  Paused = 'Paused',
  Resolved = 'Resolved'
}
```

### `useOddsWatcher` and `useOutcomeOdds`

Used for watch odds's changes and subscribe to them

#### Usage

Initialize watcher in the root of your app

```ts
import { useOddsWatcher } from '@azuro-org/sdk'

export function Watchers() {
  useOddsWatcher()

  return null
}
```

Subscribe to changes in your outcome

```ts
const odds = useOutcomeOdds({
  conditionId: outcome.conditionId,
  outcomeId: outcome.outcomeId,
  initialOdds: outcome.odds,
})
```

#### useOutcomeOdds Props

```ts
{
  conditionId: string | bigint
  outcomeId: string | bigint
  initialOdds?: string
}
```

#### useOutcomeOdds Return Value

```ts
odds: string
```


## Data Hooks

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

const game = data
```

#### Props

- **gameId**: `{string | bigint}, required` - the Subgraph `Game` gameId.
- **withConditions**: `{boolean}, optional, default: false` - if `true` the `conditions` will be added to query result.

#### Note

`gameId` property is not same as `id`. Each game fetched using `useGames` hook contains the gameId:

```ts
const { loading, error, data } = useGames()

const firstGameID = data?.games[0]?.gameId
```

```ts
const { loading, error, data } = useGame({ gameId: firstGameID })
```

<details>
<summary><h4>Interface</h4></summary>

```ts
useGame(props: Props): QueryResult<Data>

type Props = {
  gameId: string | bigint
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

- **gameId**: `{string | bigint}, required` - the Subgraph `Game` gameId.
- **filter.outcomeIds**: `{string[]}, optional` - returns only conditions which contains the passed outcome ids.

<details>
<summary><h4>Interface</h4></summary>

```ts
useConditions(props: Props): QueryResult<Data>

type Props = {
  gameId: string | bigint
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

const bets = data
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
    bettor: string
    limit?: number
    offset?: number
  }
  orderBy?: Bet_OrderBy
  orderDir?: OrderDirection
}


export type BetOutcome = {
  selectionName: string
  outcomeId: string
  odds: number
  name: string
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
  isWin: boolean | null
  isLose: boolean | null
  isCanceled: boolean
}

export type Bet = {
  tokenId: string
  freebetId: string | null
  freebetContractAddress?: Address
  totalOdds: number
  coreAddress: Address
  lpAddress: Address
  outcomes: BetOutcome[]
  txHash: string
  status: BetStatus
  amount: string
  possibleWin: number
  payout: number
  createdAt: number
  isWin: boolean
  isLose: boolean
  isRedeemable: boolean
  isRedeemed: boolean
  isCanceled: boolean
}
```
</details>

---

### `useBetsCache`

Using for update existing bet cache or add new bet to cache

#### Usage

Update bet after redeem

```ts
const { submit } = useRedeemBet()
const { updateBetCache } = useBetsCache()

const handleRedeem = async () => {
  try {
    await submit({ tokenId, coreAddress })
    updateBetCache({
      coreAddress,
      tokenId,
    }, {
      isRedeemed: true,
      isRedeemable: false,
    })
  } catch {}
}
```

Add new bet to cache

```ts
const { addBet } = useBetsCache()
const { submit } = usePrepareBet({
  amount,
  slippage: 5,
  affiliate: '0x0000000000000000000000000000000000000000',
  selections,
  onSuccess: (receipt: TransactionReceipt) => {
    addBet({
      receipt,
      bet: {
        amount,
        outcomes: selections
      }
    })
  },
})
```
