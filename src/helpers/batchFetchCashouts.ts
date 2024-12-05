import { type ChainId, getPrecalculatedCashouts } from '@azuro-org/toolkit'

import { createBatch } from './createBatch'
import { type PrecalculatedCashout } from '../hooks/cashout/usePrecalculatedCashouts'


type Result = Record<string, PrecalculatedCashout>

const getCashouts = async (conditionIds: string[], chainId: ChainId) => {
  const data = await getPrecalculatedCashouts({
    chainId,
    conditionIds,
  })

  return data?.reduce<Result>((acc, { conditionId, available, outcomes }) => {
    outcomes.forEach(({ outcomeId, multiplier }) => {
      const key = `${conditionId}-${outcomeId}`
      acc[key] = {
        conditionId,
        outcomeId: outcomeId.toString(),
        isAvailable: available,
        multiplier,
      }
    })

    return acc
  }, {})
}

type Func = typeof getCashouts

export const batchFetchCashouts = createBatch<Result, Func>(getCashouts)
