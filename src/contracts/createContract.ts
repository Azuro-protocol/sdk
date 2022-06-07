import { Contract } from '@ethersproject/contracts'

import type { ContractsABI, ContractName } from './contracts'
import { CONTRACTS } from './config'


const createContract = <Name extends ContractName>(name: Name, provider: any): ContractsABI[Name] => {
  const { address, abi } = CONTRACTS[name.toLowerCase()]

  return new Contract(address, abi, provider) as ContractsABI[Name]
}

export default createContract
