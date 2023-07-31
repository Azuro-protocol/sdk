# SDK

## Installation

```
npm install @azuro-org/sdk
```

#### Peer Dependencies

```
wagmi@^1.3.8
view^0.3.50
```


## Utils

### `chainsData`

```ts
import { chainsData } from '@azuro-org/sdk'
```

#### Usage

```ts
import { polygon } from 'wagmi'

const { chain, addresses, betToken } = chainsData[polygon.id]
```

#### Return Value

```ts
import { type Chain } from 'viem/chains'

{
  chain: Chain
  addresses: {
    lp: `0x${string}`
    prematchCore: `0x${string}`
    prematchComboCore: `0x${string}`
  }
  betToken: {
    address?: `0x${string}` | undefined
    symbol: string
    decimals: number
    isNative: boolean
  }
}
```


### `calcMindOdds`

Helper to calculate the minimum odds value at which the bet can be placed. If the current odds value is lower than the specified value, the bet cannot be placed and will be rejected by the contract.

```ts
import { calcMindOdds } from '@azuro-org/sdk'
```

#### Usage

```ts
const minOdds = calcMindOdds({ 
  odds: 1.17,
  slippage: 5, // 5% 
})
```


### `calcOdds`

Helper to fetch actual odds value from the contracts.

```ts
import { calcOdds } from '@azuro-org/sdk'
```

#### Usage

```ts
const odds = await calcOdds({
  chainId: polygon.id,
  conditionId: '486903008559711340',
  outcomeId: '29',
  amount: 10, // 10 USDT
})
```


### `watchOddsChange`

```ts
import { watchOddsChange } from '@azuro-org/sdk'
```

#### Usage

```ts
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

### `useContracts`

```ts
import { useContracts } from '@azuro-org/sdk'
```

#### Usage

```ts
const contracts = useContracts()
```

#### Return Value

```ts
{
  lp: {
    address: string
    abi: Abi
  },
  prematchCore: {
    address: string
    abi: Abi
  },
  prematchComboCore: {
    address: string
    abi: Abi
  },
}
```


### `useBetToken`

Hook to get bet token data for current chain.

```ts
import { useBetToken } from '@azuro-org/sdk'
```

#### Usage

```ts
const betToken = useBetToken()
```

#### Return Value

```ts
{
  address?: `0x${string}` | undefined
  symbol: string
  decimals: number
  isNative: boolean
}
```


### `useCalcOdds`

```ts
import { useCalcOdds } from '@azuro-org/sdk'
```

#### Usage

```ts
const odds = useCalcOdds({
  amount: 10,
  conditionId: '486903008559711340',
  outcomeId: '29',
})
```


### `usePlaceBet`

Doesn't contain `minOdds` calculation because it's based on current odds values and slippage. We should be sure that 
odds values are updated, if usePlaceBet will contain the logic of calculation when there should be not necessary call for 
odds values fetching. This should be done only in client app, not in lib itself.

```ts
import { usePlaceBet } from '@azuro-org/sdk'
```

#### Usage

```ts
const { isDisabled, isLoading, data, error, submit } = usePlaceBet()

submit({
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
```

#### Return Value

```ts
{
  isDisabled: boolean
  isLoading: boolean
  data: WriteContractResult | undefined
  error: Error | null
  submit: (props: {
    amount: number
    minOdds: number
    deadline?: number
    affiliate: `0x${string}`
    selections: {
      conditionId: string | number
      outcomeId: string | number
    }[]
  }) => void
}
```
