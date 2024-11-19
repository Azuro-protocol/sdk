import { type Address } from 'viem'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCalculatedCashout, type Selection } from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'
import { type PrecalculatedCashout } from './usePrecalculatedCashouts'


type Props = {
  account: Address
  betId: string
  selections: Omit<Selection, 'coreAddress'>[]
  isLive: boolean
}

export const useCalculatedCashout = ({ account, betId, selections, isLive }: Props) => {
  const queryClient = useQueryClient()
  const { appChain, api } = useChain()

  const queryFn = () => (
    getCalculatedCashout({
      chainId: appChain.id,
      account,
      betId,
      isLive,
    })
  )

  return useQuery({
    queryKey: [ 'cashout/calculate', api, account?.toLowerCase(), betId, isLive ],
    queryFn,
    refetchOnWindowFocus: false,
    retry: () => {
      const conditionsKey = selections.map(({ conditionId }) => conditionId).join('-')
      const queryKey = [ 'cashout/precalculate', api, conditionsKey ]

      // set precalculate query unavailable to cashout
      queryClient.setQueryData(queryKey, (oldPrecalcCashouts: Record<string, PrecalculatedCashout>) => {
        if (!oldPrecalcCashouts) {
          return oldPrecalcCashouts
        }

        const newPrecalcCashouts = { ...oldPrecalcCashouts }

        selections.forEach(({ conditionId, outcomeId }) => {
          const key = `${conditionId}-${outcomeId}`
          newPrecalcCashouts[key] = {
            ...newPrecalcCashouts[key]!,
            isAvailable: false,
          }
        })

        return newPrecalcCashouts
      })

      return false // disable retries on error
    },
    gcTime: 0, // disable cache
  })
}
