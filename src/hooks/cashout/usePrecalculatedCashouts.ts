import { type Selection } from '@azuro-org/toolkit'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'

import { useChain } from '../../contexts/chain'
import { batchFetchCashouts } from '../../helpers/batchFetchCashouts'


type Props = {
  selections: Omit<Selection, 'coreAddress'>[]
  skip?: boolean
}

export type PrecalculatedCashout = {
  available: boolean
  multiplier: string
} & Omit<Selection, 'coreAddress'>


export const usePrecalculatedCashouts = ({ selections, skip }: Props) => {
  const [ cashouts, setCashouts ] = useState<Record<string, PrecalculatedCashout>>({})
  const [ isFetching, setFetching ] = useState(Boolean(selections.length))
  const { appChain } = useChain()

  const isCashoutAvailable = useMemo(() => {
    if (!Object.keys(cashouts).length) {
      return false
    }

    return Object.values(cashouts).every(({ available }) => available)
  }, [ cashouts ])

  const totalMultiplier = useMemo(() => {
    if (!Object.keys(cashouts).length) {
      return '1'
    }

    if (Object.keys(cashouts).length === 1) {
      return Object.values(cashouts)[0]!.multiplier
    }

    return Object.values(cashouts).reduce((acc, { multiplier }) => acc *= +multiplier, 1)
  }, [ cashouts ])

  const conditionsKey = useMemo(() => selections.map(({ conditionId }) => conditionId).join('-'), [ selections ])

  const prevConditionsKey = useRef(conditionsKey)

  if (!skip && selections.length && conditionsKey !== prevConditionsKey.current) {
    setFetching(true)
  }

  prevConditionsKey.current = conditionsKey

  useEffect(() => {
    if (skip || !selections.length) {
      return
    }

    setCashouts({})

    ;(async () => {
      const data = await batchFetchCashouts(conditionsKey.split('-'), appChain.id)

      const newCashouts = selections.reduce<Record<string, PrecalculatedCashout>>((acc, { conditionId, outcomeId }) => {
        const key = `${conditionId}-${outcomeId}`
        const cashout = data?.[key]!

        acc[key] = cashout

        return acc
      }, {})

      setFetching(false)
      setCashouts(newCashouts)
    })()
  }, [ conditionsKey, skip ])

  return {
    cashouts,
    totalMultiplier,
    isCashoutAvailable,
    isFetching,
  }
}
