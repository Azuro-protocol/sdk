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
  [polygonMumbai.id]: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-mumbai-preprod-v3',
}

export const graphqlLiveEndpoint = 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-live-data-feed-preprod'
export const socketApiUrl = 'wss://preprod-streams.azuro.org/v1/streams/conditions'


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
    proxyFront: '0x3A1c6640daeAc3513726F06A9f03911CC1080251',
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
    proxyFront: '0x0DEE52b98ba8326DaD4C346a4F806Fd871360a00',
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
    lp: '0xA39e988b357122D9ba75C0038E625a5ab9363F54',
    prematchCore: '0x33742d3D8bE5A7F47D2eC1fA39fDa9FCB5288727',
    prematchComboCore: '0xb7f1B3dA0eECf0a084cdd16Df917216BB72b42f5',
    proxyFront: '0x0a727CE540258f9736eAfcD411e57Caf5a3B3b6C',
    liveRelayer: '0x2d14b12e08ED8599E020fdBC867B604Ad58F192c',
  }),
  betToken: {
    address: '0x37B9324f3Aa84DE6D062DC18C0539D5440Dca3FF',
    symbol: 'AZUSD',
    decimals: 6,
  },
}

export const chainsData = {
  [gnosis.id]: gnosisData,
  [polygon.id]: polygonData,
  [polygonMumbai.id]: polygonMumbaiData,
} as const

export const liveCoreAddress = '0xEeC45059b34BF76174C4d5E495BB380F4A810F58'
export const liveHostAddress = '0xBb35f2490B050538FCeDD6d708a37CC922973483'

export const getApiUrl = (chainId: ChainId) => {
  // there is place for testnets
  // ATTN: mumbai with live uses prod api
  if ([ 0 ].includes(chainId as any)) {
    return 'https://dev-api.azuro.org/api/v1/public'
  }

  return 'https://preprod-api.azuro.org/api/v1/public'
}

export const cookieKeys = {
  appChainId: 'appChainId',
  live: 'live',
} as const

export const localStorageKeys = {
  betslipItems: 'betslipItems',
}

export type ChainId = keyof typeof chainsData
