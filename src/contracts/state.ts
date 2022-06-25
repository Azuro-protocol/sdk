import type { Web3Provider } from '@ethersproject/providers'

import type { Contracts, ContractsAddresses } from './contracts'


type State = {
  walletProvider: Web3Provider
  selectedChainId: number
  readContracts: Contracts
  writeContracts: Contracts
  contractAddresses: ContractsAddresses
  tokenDecimals: number
  rateDecimals: number
}

const state: State = {
  walletProvider: null,
  selectedChainId: null,
  readContracts: {} as any,
  writeContracts: {} as any,
  contractAddresses: {} as ContractsAddresses,
  tokenDecimals: null,
  rateDecimals: null,
}

export const setContractAddresses = (contractAddresses: ContractsAddresses) => {
  state.contractAddresses = contractAddresses

  state.writeContracts = {} as any
  state.readContracts = {} as any
}

export const setWalletProvider = (walletProvider: Web3Provider) => {
  state.walletProvider = walletProvider

  state.writeContracts = {} as any
  state.readContracts = {} as any
}

export const setSelectedChainId = (selectedChainId: number) => {
  state.selectedChainId = selectedChainId
}

export const setTokenDecimals = (tokenDecimals: number) => {
  state.tokenDecimals = tokenDecimals
}

export const setRateDecimals = (rateDecimals: number) => {
  state.rateDecimals = rateDecimals
}

export default state
