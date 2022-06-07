import type { Core, LP, AzuroBet, TestERC20 } from './types'

export type ContractsABI = {
  'core': Core
  'lp': LP
  'bet': AzuroBet
  'usdt': TestERC20
}

export type ContractsAddresses = {
  [Name in ContractName]: string
}

export type ContractName = keyof ContractsABI

export type ContractData<Symbol extends string> = {
  address: string
  abi: object[]
  symbol?: Symbol
  decimals?: number
}

export type ContractsData = {
  [Name in ContractName]: ContractData<string>
}

export type Contracts = {
  [Name in ContractName]: ContractsABI[Name]
}
