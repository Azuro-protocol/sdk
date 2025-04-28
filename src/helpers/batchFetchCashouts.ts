import { type ChainId, getPrecalculatedCashouts } from '@azuro-org/toolkit'

import { createBatch } from './createBatch'
import { type PrecalculatedCashout } from '../hooks/cashout/usePrecalculatedCashouts'


type Result = {
  margin: string
  minMargin: string
  cashouts: Record<string, PrecalculatedCashout>
}

const getCashouts = async (conditionIds: string[], chainId: ChainId) => {
  const data = await getPrecalculatedCashouts({
    chainId,
    conditionIds,
  })

  if (!data) {
    return undefined
  }

  const { margin, marginMin, availables } = data

  const cashouts = availables.reduce<Result['cashouts']>((acc, { conditionId, available, outcomes }) => {
    outcomes.forEach(({ outcomeId, price }) => {
      const key = `${conditionId}-${outcomeId}`
      acc[key] = {
        conditionId,
        outcomeId: outcomeId.toString(),
        isAvailable: available,
        odds: price,
      }
    })

    return acc
  }, {})

  return {
    margin,
    minMargin: marginMin,
    cashouts,
  }
}

type Func = typeof getCashouts

export const batchFetchCashouts = createBatch<Result, Func>(getCashouts)
