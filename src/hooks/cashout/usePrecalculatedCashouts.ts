import { type Selection, GraphBetStatus } from '@azuro-org/toolkit'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useChain } from '../../contexts/chain'
import { batchFetchCashouts } from '../../helpers/batchFetchCashouts'


type Props = {
  selections: Omit<Selection, 'coreAddress'>[]
  graphBetStatus: GraphBetStatus
}

export type PrecalculatedCashout = {
  isAvailable: boolean
  multiplier: string
} & Omit<Selection, 'coreAddress'>


export const usePrecalculatedCashouts = ({ selections, graphBetStatus }: Props) => {
  const { appChain, api } = useChain()

  const conditionsKey = useMemo(() => selections.map(({ conditionId }) => conditionId).join('-'), [ selections ])

  const queryFn = async () => {
    const data = await batchFetchCashouts(conditionsKey.split('-'), appChain.id)

    const newCashouts = selections.reduce<Record<string, PrecalculatedCashout>>((acc, { conditionId, outcomeId }) => {
      const key = `${conditionId}-${outcomeId}`
      const cashout = data?.[key]!

      acc[key] = cashout

      return acc
    }, {})

    return newCashouts
  }

  const { data: cashouts, isFetching } = useQuery({
    queryKey: [ 'cashout/precalculate', api, conditionsKey ],
    queryFn,
    gcTime: 0, // disable cache
    enabled: Boolean(selections.length) && graphBetStatus === GraphBetStatus.Accepted,
    refetchInterval: 60_000,
  })

  const isCashoutAvailable = useMemo(() => {
    if (!cashouts || !Object.keys(cashouts).length) {
      return false
    }

    return Object.values(cashouts).every(({ isAvailable }) => isAvailable)
  }, [ cashouts ])

  const totalMultiplier = useMemo(() => {
    if (!cashouts || !Object.keys(cashouts).length) {
      return '1'
    }

    if (Object.keys(cashouts).length === 1) {
      return Object.values(cashouts)[0]!.multiplier
    }

    return Object.values(cashouts).reduce((acc, { multiplier }) => acc *= +multiplier, 1)
  }, [ cashouts ])

  return {
    cashouts,
    totalMultiplier,
    isCashoutAvailable,
    isFetching,
  }
}
