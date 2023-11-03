import { useAccount, useBalance } from 'wagmi'
import { useChain } from '../contexts/chain'


export const useNativeBalance = () => {
  const { appChain } = useChain()
  const { address } = useAccount()

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
