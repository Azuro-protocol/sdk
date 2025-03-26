import { useQuery } from '@tanstack/react-query'
import { getLiveBetFee } from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


type Result = {
  gasAmount: bigint,
  relayerFeeAmount: bigint,
  formattedRelayerFeeAmount: string,
}

type Props = {
  enabled?: boolean
  query?: QueryParameter<Result>
}

export const useBetFee = (props: Props) => {
  const { enabled = true, query = {} } = props
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

  let { data, ...rest } = useQuery({
    queryKey: [ '/bet-fee', appChain.id ],
    queryFn,
    enabled,
    refetchOnWindowFocus: false,
    refetchInterval: 10_000,
    ...query,
  })

  if (!enabled) {
    data = undefined
  }

  return {
    data,
    ...rest,
  }
}
