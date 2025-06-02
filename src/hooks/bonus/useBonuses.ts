import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { type Bonus, type BonusStatus, type ChainId, getBonuses } from '@azuro-org/toolkit'
import { type Address } from 'viem'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


export type UseBonusesProps = {
  account: Address
  affiliate: Address
  bonusStatus?: BonusStatus
  chainId?: ChainId
  query?: QueryParameter<Bonus[]>
}

export type UseBonuses = (props: UseBonusesProps) => UseQueryResult<Bonus[]>

export const useBonuses: UseBonuses = (props) => {
  const { account, affiliate, bonusStatus, chainId, query = {} } = props

  const { chain: appChain } = useOptionalChain(chainId)

  return useQuery({
    queryKey: [ 'bonuses', appChain.id, account?.toLowerCase(), affiliate?.toLowerCase(), bonusStatus ],
    queryFn: async () => {
      const bonuses = await getBonuses({
        chainId: appChain.id,
        account,
        bonusStatus,
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
