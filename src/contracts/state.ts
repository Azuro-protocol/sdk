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
  state.contractAddresses = contractAddresses;

  state.writeContracts = {} as any;
  state.readContracts = {} as any;
}

export const setWallerProvider = (walletProvider: Web3Provider) => {
  state.walletProvider = walletProvider

  state.writeContracts = {} as any;
  state.readContracts = {} as any;
}

export const setSelectedChainId = (selectedChainId: number) => {
  state.selectedChainId = selectedChainId
}

export default state
