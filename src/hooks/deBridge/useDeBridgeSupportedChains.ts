import { useQuery } from '@tanstack/react-query'
import { deBridgeUrl } from '@azuro-org/toolkit'


type SupportedChainsResponse = {
  chains: {
    chainId: number
    chainName: string
  }[]
}

type Props = {
  enabled?: boolean
}

export const useDeBridgeSupportedChains = ({ enabled }: Props = { enabled: true }) => {
  const queryFn = async () => {
    const response = await fetch(`${deBridgeUrl}/supported-chains-info`)
    const { chains }: SupportedChainsResponse = await response.json()


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
