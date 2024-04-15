import { polygon, gnosis, polygonAmoy, type Chain } from 'viem/chains'
import { parseUnits, type Address } from 'viem'

import { liveCoreAbi, lpAbi, prematchComboCoreAbi, prematchCoreAbi, proxyFrontAbi } from './abis'


export const DEFAULT_CACHE_TIME = 3 * 60
export const MAX_UINT_256 = parseUnits('340282366920938463463', 0)
export const DEFAULT_DEADLINE = 300 // 5 min
export const ODDS_DECIMALS = 12

export const configRef = {
  gamesCacheTime: DEFAULT_CACHE_TIME,
}

const getGraphqlPrematchEndpoint = (network: string) => `https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-${network}-v3`

const getGraphqlLiveEndpoint = (chainId: number) => {
  if (chainId === polygonAmoy.id) {
    return 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-live-data-feed-preprod'
  }

  return 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-live-data-feed'
}

const getSocketEndpoint = (chainId: number) => {
  if (chainId === polygonAmoy.id) {
    return 'wss://preprod-streams.azuro.org/v1/streams/conditions'
  }

  return 'wss://streams.azuro.org/v1/streams/conditions'
}

export const getApiUrl = (chainId: ChainId) => {
  if (chainId === polygonAmoy.id) {
    return 'https://preprod-api.azuro.org/api/v1/public'
  }

  return 'https://api.azuro.org/api/v1/public'
}

export const deBridgeUrl = 'https://api.dln.trade/v1.0'
export const deBridgeTxUrl = 'https://stats-api.dln.trade/api'

type SetupContractsProps = {
  lp: Address
  prematchCore: Address
  prematchComboCore: Address
  proxyFront: Address
  liveRelayer?: Address
  liveCore?: Address
}

const setupContracts = ({ lp, prematchCore, prematchComboCore, proxyFront, liveRelayer, liveCore }: SetupContractsProps): Contracts => {
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

  if (liveCore) {
    contracts.liveCore = {
      address: liveCore,
      abi: liveCoreAbi,
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
  liveCore?: {
    address: Address
    abi: typeof liveCoreAbi
  }
}

type BetToken = {
  address?: Address | undefined
  symbol: string
  decimals: number
}

export type ChainData = {
  chain: Omit<Chain, 'id'> & { id: ChainId }
  graphql: {
    prematch: string,
    live: string,
  }
  socket: string
  contracts: Contracts
  betToken: BetToken
}

const gnosisData: ChainData = {
  chain: gnosis,
  graphql: {
    prematch: getGraphqlPrematchEndpoint('gnosis'),
    live: getGraphqlLiveEndpoint(gnosis.id),
  },
  socket: getSocketEndpoint(gnosis.id),
  contracts: setupContracts({
    lp: '0x204e7371Ade792c5C006fb52711c50a7efC843ed',
    prematchCore: '0x7f3F3f19c4e4015fd9Db2f22e653c766154091EF',
    prematchComboCore: '0xDbC3BE2DDB53e1a288F7b7a4d020F8056D3b0F7C',
    proxyFront: '0x3A1c6640daeAc3513726F06A9f03911CC1080251',
    liveRelayer: '0x936c02503A32aA23BCF7CFaF5c29100b0F93FCfe',
    liveCore: '0x0223ff7efca5aec919c471fa2eb44cda466f1500',
  }),
  betToken: {
    address: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    symbol: 'WXDAI',
    decimals: 18,
  },
}

const polygonData: ChainData = {
  chain: polygon,
  graphql: {
    prematch: getGraphqlPrematchEndpoint('polygon'),
    live: getGraphqlLiveEndpoint(polygon.id),
  },
  socket: getSocketEndpoint(polygon.id),
  contracts: setupContracts({
    lp: '0x7043E4e1c4045424858ECBCED80989FeAfC11B36',
    prematchCore: '0xA40F8D69D412b79b49EAbdD5cf1b5706395bfCf7',
    prematchComboCore: '0x92a4e8Bc6B92a2e1ced411f41013B5FE6BE07613',
    proxyFront: '0x0DEE52b98ba8326DaD4C346a4F806Fd871360a00',
  }),
  betToken: {
    address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    symbol: 'USDT',
    decimals: 6,
  },
}

const polygonAmoyData: ChainData = {
  chain: polygonAmoy,
  graphql: {
    prematch: getGraphqlPrematchEndpoint('polygon-amoy-preprod'),
    live: getGraphqlLiveEndpoint(polygonAmoy.id),
  },
  socket: getSocketEndpoint(polygonAmoy.id),
  contracts: setupContracts({
    lp: '0x3528186476FD0eA0AdC9fCcc41de4CD138f99653',
    prematchCore: '0x2477B960080B3439b4684df3D9CE53B2ACe64315',
    prematchComboCore: '0xdF71998f7931caD24439A12A2F56D7326C3D0295',
    proxyFront: '0x7003CaA0847CA296EBF51C43D9021656a663304f',
    liveRelayer: '0x355B8493380fA5D57E4d3aFBF7C5f38b64AD5eA9',
    liveCore: '0x51eD5C2596d9AE32cE53ac1915Cb9333AFeF3156',
  }),
  betToken: {
    address: '0xf028b2dd00e20a8d9db3964a5feb0633d2ee46cd',
    symbol: 'AZUSD',
    decimals: 6,
  },
}

export const chainsData = {
  [gnosis.id]: gnosisData,
  [polygon.id]: polygonData,
  [polygonAmoy.id]: polygonAmoyData,
} as const

export const liveHostAddress = '0x67Fca88E2f5F2C33b86bFa4EccfCb8dCD6a56D17'
export const liveSupportedChains: ChainId[] = [ gnosis.id, polygonAmoy.id ]
/**
 * Live Betting for Gnosis in beta, only 1 WXDAI possible
 */
export const liveBetAmount = '1'

export const environments = {
  [gnosis.id]: 'GnosisXDAI',
  [polygon.id]: 'PolygonUSDT',
  [polygonAmoy.id]: 'PolygonAmoyAZUSD',
} as const

export const cookieKeys = {
  appChainId: 'appChainId',
  live: 'live',
} as const

export const localStorageKeys = {
  betslipItems: 'betslipItems',
}

export type ChainId = keyof typeof chainsData
