import { type Abi } from 'abitype'
import { useChainId } from 'wagmi'
import { chainsData } from '../config'
import { lpAbi, prematchCoreAbi, prematchComboCoreAbi } from '../abis'


type Contract<V extends Abi> = {
  address: `0x${string}`
  abi: V
}

// don't move this type to separate variable! This will broke types notation in useContractWrite() variable values
export const useContracts = (): {
  lp: Contract<typeof lpAbi>
  prematchCore: Contract<typeof prematchCoreAbi>
  prematchComboCore: Contract<typeof prematchComboCoreAbi>
} | undefined => {
  const chainId = useChainId()
  const chainData = chainsData[chainId]

  if (!chainData) {
    console.error(`Selected network not supported.`)
    return
  }

  return {
    lp: {
      address: chainData.addresses.lp,
      abi: lpAbi,
    },
    prematchCore: {
      address: chainData.addresses.prematchCore,
      abi: prematchCoreAbi,
    },
    prematchComboCore: {
      address: chainData.addresses.prematchComboCore,
      abi: prematchComboCoreAbi,
    },
  }
}
