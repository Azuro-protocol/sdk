import { useQuery } from '@tanstack/react-query'
import { getDeBridgeSupportedChains } from '@azuro-org/toolkit'


type Props = {
  enabled?: boolean
}

export const useDeBridgeSupportedChains = ({ enabled }: Props = { enabled: true }) => {
  const queryFn = async () => {
    const chains = await getDeBridgeSupportedChains()

    if (!chains) {
      return chains
    }

    const chainIds = chains.map(({ chainId }) => chainId)

    return {
      chains,
      chainIds,
    }
  }

  const { isFetching, data, refetch } = useQuery({
    queryKey: [ '/debridge-supported-chains' ],
    queryFn,
    enabled,
    refetchOnWindowFocus: false,
  })

  return {
    supportedChains: data?.chains,
    supportedChainIds: data?.chainIds,
    refetch,
    loading: isFetching,
  }
}
