import type { Web3Provider } from '@ethersproject/providers'

import type { Contracts, ContractsAddresses } from './contracts'

type State = {
  walletProvider: Web3Provider
  selectedChainId: number
  readContracts: Contracts
  writeContracts: Contracts
  contractAddresses: ContractsAddresses
}

const state: State = {
  walletProvider: null,
  selectedChainId: null,
  readContracts: {} as any,
  writeContracts: {} as any,
  contractAddresses: {} as ContractsAddresses,
}

export const setContractAddresses = (contractAddresses: ContractsAddresses) => {
  if (contractAddresses.bet) {
    state.contractAddresses.bet = contractAddresses.bet;
  }
  if (contractAddresses.usdt) {
    state.contractAddresses.usdt = contractAddresses.usdt;
  }
  if (contractAddresses.core) {
    state.contractAddresses.core = contractAddresses.core;
  }
  if (contractAddresses.lp) {
    state.contractAddresses.lp = contractAddresses.lp;
  }
}

export const setWallerProvider = (walletProvider: Web3Provider) => {
  state.walletProvider = walletProvider
}

export const setSelectedChainId = (selectedChainId: number) => {
  state.selectedChainId = selectedChainId
}

export default state
