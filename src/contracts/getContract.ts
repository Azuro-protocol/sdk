import type { Contracts, ContractName } from './contracts'
import createContract from './createContract'
import getProvider from './getProvider'
import state from './state'


const getContract = <Name extends ContractName>(name: Name, withWalletProvider?: boolean): Contracts[Name] => {
  const store = (withWalletProvider ? state.writeContracts : state.readContracts) as Contracts

  if (!store[name]) {
    const provider = getProvider(withWalletProvider)
    const contract = createContract(name, provider) as any

    store[name] = contract
  }

  return store[name]
}

export default getContract
