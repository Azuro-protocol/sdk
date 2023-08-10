import { useAccount, useBalance } from 'wagmi'
import { useChain } from '../contexts/chain'


export const useBetTokenBalance = () => {
  const { appChain, betToken } = useChain()
  const account = useAccount()

  const { isLoading, data, error } = useBalance({
    chainId: appChain.id,
    address: account.address,
    token: betToken.address,
    enabled: !betToken.isNative,
  })

  return {
    loading: isLoading,
    rawBalance: data?.value,
    balance: data?.formatted ? parseFloat(data?.formatted) : null,
    error,
  }
}
