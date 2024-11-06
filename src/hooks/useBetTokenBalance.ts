import { useBalance } from 'wagmi'

import { useChain } from '../contexts/chain'
import { useExtendedAccount } from '../hooks/useAaConnector'


export const useBetTokenBalance = () => {
  const { appChain, betToken } = useChain()
  const { address } = useExtendedAccount()

  const { isLoading, data, error } = useBalance({
    chainId: appChain.id,
    address,
    token: betToken.address,
  })

  return {
    loading: isLoading,
    rawBalance: data?.value,
    balance: data?.formatted,
    error,
  }
}
