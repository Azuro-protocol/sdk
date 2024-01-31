import { polygon, gnosis, polygonMumbai, type Chain } from 'viem/chains'
import { parseUnits, type Address } from 'viem'

import { lpAbi, prematchComboCoreAbi, prematchCoreAbi, proxyFrontAbi } from './abis'


export const DEFAULT_CACHE_TIME = 3 * 60
export const MAX_UINT_256 = parseUnits('340282366920938463463', 0)
export const DEFAULT_DEADLINE = 300 // 5 min
export const ODDS_DECIMALS = 12

export const configRef = {
  gamesCacheTime: DEFAULT_CACHE_TIME,
}

const getGraphqlEndpoint = (network: string) => `https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-${network}-v3`

export const graphqlEndpoints: Record<number, string> = {
  [gnosis.id]: getGraphqlEndpoint('gnosis'),
  [polygon.id]: getGraphqlEndpoint('polygon'),
  [polygonMumbai.id]: getGraphqlEndpoint('mumbai-dev'),
}

export const graphqlLiveEndpoint = 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-live-data-feed-dev'
export const socketApiUrl = 'wss://dev-streams.azuro.org/v1/streams/conditions'


type SetupContractsProps = {
  lp: Address
  prematchCore: Address
  prematchComboCore: Address
  proxyFront: Address
  liveRelayer?: Address
}

const setupContracts = ({ lp, prematchCore, prematchComboCore, proxyFront, liveRelayer }: SetupContractsProps): Contracts => {
  const contracts: Contracts = {
    lp: {
      address: lp,
      abi: lpAbi,
    },
    prematchCore: {
      address: prematchCore,
      abi: prematchCoreAbi,
    },
    prematchComboCore: {
      address: prematchComboCore,
      abi: prematchComboCoreAbi,
    },
    proxyFront: {
      address: proxyFront,
      abi: proxyFrontAbi,
    },
  }

  if (liveRelayer) {
    contracts.liveRelayer = {
      address: liveRelayer,
    }
  }

  return contracts
}

type Contracts = {
  lp: {
    address: Address
    abi: typeof lpAbi
  }
  prematchCore: {
    address: Address
    abi: typeof prematchCoreAbi
  }
  prematchComboCore: {
    address: Address
    abi: typeof prematchComboCoreAbi
  }
  proxyFront: {
    address: Address
    abi: typeof proxyFrontAbi
  }
  liveRelayer?: {
    address: Address
  }
}

type BetToken = {
  address?: Address | undefined
  symbol: string
  decimals: number
}

export type ChainData = {
  chain: Omit<Chain, 'id'> & { id: ChainId }
  contracts: Contracts
  betToken: BetToken
}

const gnosisData: ChainData = {
  chain: gnosis,
  contracts: setupContracts({
    lp: '0x204e7371Ade792c5C006fb52711c50a7efC843ed',
    prematchCore: '0x7f3F3f19c4e4015fd9Db2f22e653c766154091EF',
    prematchComboCore: '0xDbC3BE2DDB53e1a288F7b7a4d020F8056D3b0F7C',
    proxyFront: '0xaAAc47Bb9B16bcF89FdB54B1326327a223458d6d',
  }),
  betToken: {
    address: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    symbol: 'WXDAI',
    decimals: 18,
  },
}

const polygonData: ChainData = {
  chain: polygon,
  contracts: setupContracts({
    lp: '0x7043E4e1c4045424858ECBCED80989FeAfC11B36',
    prematchCore: '0xA40F8D69D412b79b49EAbdD5cf1b5706395bfCf7',
    prematchComboCore: '0x92a4e8Bc6B92a2e1ced411f41013B5FE6BE07613',
    proxyFront: '0x200BD65A3189930634af857C72281abE63C3da5e',
  }),
  betToken: {
    address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    symbol: 'USDT',
    decimals: 6,
  },
}

const polygonMumbaiData: ChainData = {
  chain: polygonMumbai,
  contracts: setupContracts({
    lp: '0xe47F16bc95f4cF421f008BC5C23c1D3d5F402935',
    prematchCore: '0x8ea11e2aefab381e87b644e018ae1f78aa338851',
    prematchComboCore: '0xc0a46fc9952e4b804960a91ece75f89952a2c205',
    proxyFront: '0xa43328ABd99ae605A87661E7fC84a0e509DE6BD0',
    liveRelayer: '0x548bCB06650eC6702B979d235c660e5047B0A07f',
  }),
  betToken: {
    address: '0xe656De3EC9eFf1B851e0b39AFFaa1478353885a4',
    symbol: 'USDT',
    decimals: 6,
  },
}

export const chainsData = {
  [gnosis.id]: gnosisData,
  [polygon.id]: polygonData,
  [polygonMumbai.id]: polygonMumbaiData,
} as const

export const liveCoreAddress = '0x6B55953a3085AAb3cd36f02ed29622b63aDa526C'
export const liveHostAddress = '0x2276b77B2C6ea24e1677F40A821D07907f5Dbba0'

export const getApiUrl = (chainId: ChainId) => {
  if ([ polygonMumbai.id ].includes(chainId as any)) {
    return 'https://dev-api.azuro.org/api/v1/public'
  }

  return 'https://api.azuro.org/api/v1/public'
}

export const cookieKeys = {
  appChainId: 'appChainId',
  live: 'live',
} as const

export const localStorageKeys = {
  betslipItems: 'betslipItems',
}

export type ChainId = keyof typeof chainsData
