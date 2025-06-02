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
