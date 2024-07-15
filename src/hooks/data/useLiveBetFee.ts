import { useQuery } from '@tanstack/react-query'
import { getLiveBetFee } from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'


type Props = {
  enabled?: boolean
}

export const useLiveBetFee = ({ enabled }: Props = { enabled: true }) => {
  const { appChain } = useChain()

  const queryFn = async () => {
    const {
      gasAmount,
      relayerFeeAmount,
      beautyRelayerFeeAmount,
    } = await getLiveBetFee(appChain.id)

    return {
      gasAmount: BigInt(gasAmount),
      relayerFeeAmount: BigInt(relayerFeeAmount),
      formattedRelayerFeeAmount: beautyRelayerFeeAmount,
    }
  }

  let { isFetching, data, refetch } = useQuery({
    queryKey: [ '/live-bet-fee', appChain.id ],
    queryFn,
    enabled,
    refetchOnWindowFocus: false,
    refetchInterval: 10000,
  })

  if (!enabled) {
    data = undefined
  }

  return {
    gasAmount: data?.gasAmount,
    relayerFeeAmount: data?.relayerFeeAmount,
    formattedRelayerFeeAmount: data?.formattedRelayerFeeAmount,
    refetch,
    loading: isFetching,
  }
}
