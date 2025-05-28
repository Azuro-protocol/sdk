import { useQuery } from '@tanstack/react-query'
import { type ChainId, getBetFee } from '@azuro-org/toolkit'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


type Result = {
  gasAmount: bigint,
  relayerFeeAmount: bigint,
  formattedRelayerFeeAmount: string,
}

type Props = {
  chainId?: ChainId
  query?: QueryParameter<Result>
}

export const useBetFee = ({ chainId, query = {} }: Props = {}) => {
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
