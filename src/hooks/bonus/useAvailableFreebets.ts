import { useQuery } from '@tanstack/react-query'
import { type ChainId, type Freebet, type Selection, getAvailableFreebets } from '@azuro-org/toolkit'
import { type Address } from 'viem'
import { useCallback, useMemo } from 'react'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


type Props = {
  account: Address
  affiliate: Address
  selections: Selection[]
  chainId?: ChainId
  query?: QueryParameter<Freebet[]>
}

export const useAvailableFreebets = (props: Props) => {
  const { account, affiliate, selections, chainId, query = {} } = props

  const { chain: appChain, api } = useOptionalChain(chainId)

  const selectionsKey = useMemo(() => (
    selections.map(({ conditionId, outcomeId }) => `${conditionId}/${outcomeId}`).join('-')
  ), [ selections ])

  const formatData = useCallback((data: Freebet[]) => {
    return data.filter(({ chainId }) => +chainId === appChain.id)
  }, [ appChain.id ])

  return useQuery({
    queryKey: [ 'available-freebets', api, account?.toLowerCase(), affiliate?.toLowerCase(), selectionsKey ],
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
    select: formatData,
    ...query,
  })
}
