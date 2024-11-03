import { useBalance } from 'wagmi'

import { useChain } from '../contexts/chain'
import { useExtendedAccount } from '../hooks/useAaConnector'


export const useNativeBalance = () => {
  const { appChain } = useChain()
  const { address } = useExtendedAccount()

  const { isLoading, data, error } = useBalance({
    chainId: appChain.id,
    address,
  })

  return {
    loading: isLoading,
    rawBalance: data?.value,
    balance: data?.formatted,
    error,
  }
}
