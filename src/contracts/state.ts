import type { Web3Provider } from '@ethersproject/providers'

import type { Contracts, ContractsAddresses } from './contracts'


type State = {
  walletProvider: Web3Provider
  selectedChainId: number
  readContracts: Contracts
  writeContracts: Contracts
  contractAddresses: ContractsAddresses
  tokenDecimals: number | Promise<number>
  rateDecimals: number | Promise<number>
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

const flushState = () => {
  state.writeContracts = {} as any
  state.readContracts = {} as any

  state.tokenDecimals = null
  state.rateDecimals = null
}

export const setContractAddresses = (contractAddresses: ContractsAddresses) => {
  state.contractAddresses = contractAddresses

  flushState()
}

export const setWalletProvider = (walletProvider: Web3Provider) => {
  state.walletProvider = walletProvider

  flushState()
}

export const setSelectedChainId = (selectedChainId: number) => {
  state.selectedChainId = selectedChainId
}

export default state
