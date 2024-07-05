import { useQuery } from '@tanstack/react-query'
import { getDeBridgeSupportedTokens } from '@azuro-org/toolkit'


type Props = {
  chainId: number
  enabled?: boolean
}

export const useDeBridgeSupportedTokens = ({ chainId, enabled = true }: Props) => {
  const queryFn = async () => {
    const tokens = await getDeBridgeSupportedTokens(chainId)

    if (!tokens) {
      return tokens
    }

    const supportedTokens = Object.values(tokens)

    return {
      supportedTokens,
      tokenAddresses: supportedTokens.map(({ address }) => address),
    }
  }

  const { isFetching, data, refetch } = useQuery({
    queryKey: [ '/debridge-supported-tokens', chainId ],
    queryFn,
    enabled,
    refetchOnWindowFocus: false,
  })

  return {
    supportedTokens: data?.supportedTokens,
    supportedTokenAddresses: data?.tokenAddresses,
    refetch,
    loading: isFetching,
  }
}
