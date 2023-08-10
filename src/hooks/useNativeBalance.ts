import { useAccount, useBalance } from 'wagmi'
import { useChain } from '../contexts/chain'


export const useNativeBalance = () => {
  const { appChain } = useChain()
  const account = useAccount()

  const { isLoading, data, error } = useBalance({
    chainId: appChain.id,
    address: account.address,
  })

  return {
    isFetching: isLoading,
    rawBalance: data?.value,
    balance: data?.formatted ? parseFloat(data?.formatted) : null,
    error,
  }
}
