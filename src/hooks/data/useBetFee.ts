import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { type ChainId, getBetFee } from '@azuro-org/toolkit'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


type UseBetFeeResult = {
  gasAmount: bigint
  relayerFeeAmount: bigint
  formattedRelayerFeeAmount: string
}

export type UseBetFeeProps = {
  chainId?: ChainId
  query?: QueryParameter<UseBetFeeResult>
}

export type UseBetFee = (props?: UseBetFeeProps) => UseQueryResult<UseBetFeeResult>

/**
 * Fetches current bet placement fee information including gas and relayer fees.
 * Auto-refetches every 10 seconds to keep fee estimates up to date.
 *
 * Returns gas amount, relayer fee amount (as bigint), and formatted relayer fee.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useBetFee
 *
 * @example
 * import { useBetFee } from '@azuro-org/sdk'
 *
 * const { data, isLoading } = useBetFee()
 * const { gasAmount, relayerFeeAmount, formattedRelayerFeeAmount } = data || {}
 * */
export const useBetFee: UseBetFee = ({ chainId, query = {} } = {}) => {
  const { chain: appChain } = useOptionalChain(chainId)

  const queryFn = async () => {
    const {
      gasAmount,
      relayerFeeAmount,
      beautyRelayerFeeAmount,
    } = await getBetFee(appChain.id)

    return {
      gasAmount: BigInt(gasAmount),
      relayerFeeAmount: BigInt(relayerFeeAmount),
      formattedRelayerFeeAmount: beautyRelayerFeeAmount,
    }
  }

  return useQuery({
    queryKey: [ '/bet-fee', appChain.id ],
    queryFn,
    refetchOnWindowFocus: false,
    refetchInterval: 10_000,
    ...query,
  })
}
