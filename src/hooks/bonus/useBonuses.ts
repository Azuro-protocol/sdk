import { useQuery } from '@tanstack/react-query'
import { type Bonus, getBonuses } from '@azuro-org/toolkit'
import { type Address } from 'viem'
import { useCallback } from 'react'

import { useChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


type Props = {
  account: Address
  affiliate: Address
  query?: QueryParameter<Bonus[]>
}

export const useBonuses = (props: Props) => {
  const { account, affiliate, query = {} } = props
  const { appChain, api } = useChain()

  const formatData = useCallback((data: Bonus[]) => {
    return data.filter(({ chainId }) => +chainId === appChain.id)
  }, [ appChain.id ])

  return useQuery({
    queryKey: [ 'bonuses', api, account?.toLowerCase(), affiliate?.toLowerCase() ],
    queryFn: async () => {
      const bonuses = await getBonuses({
        chainId: appChain.id,
        account,
        affiliate,
      })

      if (!bonuses) {
        return []
      }

      return bonuses
    },
    refetchOnWindowFocus: false,
    select: formatData,
    ...query,
  })
}
