import { useQuery } from '@tanstack/react-query'
import { deBridgeUrl } from '@azuro-org/toolkit'


type SupportedTokensResponse = {
  tokens: Record<string, {
    address: string
    symbol: string,
    decimals: number,
    name: string,
    logoURI: string,
    tags: Array<string>
  }>
}

type Props = {
  chainId: number
  enabled?: boolean
}

export const useDeBridgeSupportedTokens = ({ chainId, enabled = true }: Props) => {
  const queryFn = async () => {
    const response = await fetch(`${deBridgeUrl}/token-list?chainId=${chainId}`)
    const { tokens }: SupportedTokensResponse = await response.json()

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
