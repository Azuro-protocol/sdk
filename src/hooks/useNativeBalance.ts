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
    isFetching: isLoading,
    rawBalance: data?.value,
    balance: data?.formatted ? parseFloat(data?.formatted) : null,
    error,
  }
}
