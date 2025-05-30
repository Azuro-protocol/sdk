import { useQuery } from '@tanstack/react-query'
import { type Bonus, type ChainId, getBonuses } from '@azuro-org/toolkit'
import { type Address } from 'viem'
import { useCallback } from 'react'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


type Props = {
  account: Address
  affiliate: Address
  chainId?: ChainId
  query?: QueryParameter<Bonus[]>
}

export const useBonuses = (props: Props) => {
  const { account, affiliate, chainId, query = {} } = props

  const { chain: appChain } = useOptionalChain(chainId)

  return useQuery({
    queryKey: [ 'bonuses', appChain.id, account?.toLowerCase(), affiliate?.toLowerCase() ],
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
    ...query,
  })
}
