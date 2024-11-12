import { type Selection } from '@azuro-org/toolkit'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useChain } from '../../contexts/chain'
import { type Cashout } from '../../global'
import { batchFetchCashouts } from '../../helpers/batchFetchCashouts'


type Props = {
  selections: Omit<Selection, 'coreAddress'>[]
}

export const usePrecalculatedCashout = ({ selections }: Props) => {
  const [ cashouts, setCashouts ] = useState<Record<string, Cashout>>({})
  const [ isFetching, setFetching ] = useState(Boolean(selections.length))
  const { appChain } = useChain()

  const conditionsKey = useMemo(() => selections.map(({ conditionId }) => conditionId).join('-'), [ selections ])

  const prevConditionsKey = useRef(conditionsKey)

  if (selections.length && conditionsKey !== prevConditionsKey.current) {
    setFetching(true)
  }

  prevConditionsKey.current = conditionsKey

  useEffect(() => {
    if (!selections.length) {
      return
    }

    ;(async () => {
      const data = await batchFetchCashouts(conditionsKey.split('-'), appChain.id)

      const newCashouts = selections.reduce<Record<string, Cashout>>((acc, { conditionId, outcomeId }) => {
        const key = `${conditionId}-${outcomeId}`
        const cashout = data?.[key]!

        acc[key] = cashout

        return acc
      }, {})

      setFetching(false)
      setCashouts(newCashouts)
    })()
  }, [ conditionsKey ])

  return {
    cashouts,
    isFetching,
  }
}
