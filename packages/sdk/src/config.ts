import { arbitrum, polygon, gnosis, type Chain } from 'viem/chains'


export const DEFAULT_DEADLINE = 300 // 5 min
export const ODDS_DECIMALS = 12

type ChainData = {
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

export const chainsData: Record<number, ChainData> = {
  [arbitrum.id]: {
    chain: arbitrum,
    addresses: {
      lp: '0x20513ba6A4717c67e14291331BC99dd2aCE90038',
      prematchCore: '0x7a75cfb4D5394e213D80AA683056eF796Ccc6693',
      prematchComboCore: '0x11470095252A6FE41C8ee6F7628ffB9298a1051C',
    },
    betToken: {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      symbol: 'USDT',
      decimals: 6,
      isNative: false,
    },
  },
  [polygon.id]: {
    chain: polygon,
    addresses: {
      lp: '0x7043E4e1c4045424858ECBCED80989FeAfC11B36',
      prematchCore: '0x3B182e9FbF50398A412d17D7969561E3BfcC4fA4',
      prematchComboCore: '0xbb13f8981cefd19ddc5338f0f1e11de45e8a11ca',
    },
    betToken: {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      decimals: 6,
      isNative: false,
    },
  },
  [gnosis.id]: {
    chain: gnosis,
    addresses: {
      lp: '0x7043E4e1c4045424858ECBCED80989FeAfC11B36',
      prematchCore: '0x3B182e9FbF50398A412d17D7969561E3BfcC4fA4',
      prematchComboCore: '0xbb13f8981cefd19ddc5338f0f1e11de45e8a11ca',
    },
    betToken: {
      address: undefined,
      symbol: 'XDAI',
      decimals: 18,
      isNative: true,
    }
  },
}
