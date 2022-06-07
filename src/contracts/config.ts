import { ContractsData } from './contracts'
import CoreABI from './abis/Core.json'
import LpABI from './abis/Lp.json'
import AzuroBetABI from './abis/AzuroBet.json'
import TestERC20ABI from './abis/TestERC20.json'
import state from './state'

export const CONTRACTS: ContractsData = {
  core: {
    get address() {
      return state.contractAddresses.core;
    },
    abi: CoreABI,
    decimals: 18,
  },
  lp: {
    get address() {
      return state.contractAddresses.lp;
    },
    abi: LpABI,
    decimals: 18,
  },
  bet: {
    get address() {
      return state.contractAddresses.bet;
    },
    abi: AzuroBetABI,
    decimals: 18,
  },
  usdt: {
    get address() {
      return state.contractAddresses.usdt;
    },
    abi: TestERC20ABI,
    decimals: 18,
  },
}
