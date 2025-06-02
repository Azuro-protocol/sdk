import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { type ChainId, type Freebet, type Selection, getAvailableFreebets } from '@azuro-org/toolkit'
import { type Address } from 'viem'
import { useMemo } from 'react'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


export type UseAvailableFreebetsProps = {
  account: Address
  affiliate: Address
  selections: Selection[]
  chainId?: ChainId
  query?: QueryParameter<Freebet[]>
}

export type UseAvailableFreebets = (props: UseAvailableFreebetsProps) => UseQueryResult<Freebet[]>

export const useAvailableFreebets: UseAvailableFreebets = (props) => {
  const { account, affiliate, selections, chainId, query = {} } = props

  const { chain: appChain } = useOptionalChain(chainId)

  const selectionsKey = useMemo(() => (
    selections.map(({ conditionId, outcomeId }) => `${conditionId}/${outcomeId}`).join('-')
  ), [ selections ])

  return useQuery({
    queryKey: [ 'available-freebets', appChain.id, account?.toLowerCase(), affiliate?.toLowerCase(), selectionsKey ],
    queryFn: async () => {
      const freebets = await getAvailableFreebets({
        chainId: appChain.id,
        account,
        affiliate,
        selections,
      })

      if (!freebets) {
        return []
      }

      return freebets
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}
