import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { deBridgeUrl } from 'src/config'
import { useChain } from 'src/contexts/chain'


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
  const { appChain } = useChain()

  const queryFn = async () => {
    const response = await fetch(`${deBridgeUrl}/supported-chains-info`)
    const { chains }: SupportedChainsResponse = await response.json()

    return chains
  }

  const { isFetching, data, refetch } = useQuery({
    queryKey: [ '/debridge-supported-chains' ],
    queryFn,
    enabled,
    refetchOnWindowFocus: false,
  })

  const { supportedChains, supportedChainIds } = useMemo(() => {
    if (!data?.length) {
      return {}
    }

    const filteredChains = data?.filter(chain => chain.chainId !== appChain.id)
    const supportedChainIds = filteredChains.map(({ chainId }) => chainId)

    return {
      supportedChains: filteredChains,
      supportedChainIds,
    }
  }, [ appChain.id, data ])

  return {
    supportedChains,
    supportedChainIds,
    refetch,
    loading: isFetching,
  }
}
