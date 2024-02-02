import { useEffect, useState } from 'react'
import { formatUnits } from 'viem'
import { usePublicClient } from 'wagmi'

import { oddsWatcher } from '../modules/oddsWatcher'
import { ODDS_DECIMALS, liveHostAddress } from '../config'
import { useChain } from '../contexts/chain'
import { useApolloClients } from '../contexts/apollo'
import { useSocket, type OddsChangedData } from '../contexts/socket'
import type { Selection } from '../global'
import { ConditionStatus } from '../docs/prematch/types'
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher'
import { batchFetchOutcome } from '../helpers/batchFetchOutcome'
import { batchSocketSubscribe, batchSocketUnsubscribe } from '../helpers'


type Props = {
  selection: Selection
  initialOdds?: number
  initialStatus?: ConditionStatus
}

export const useOutcome = ({ selection, initialOdds, initialStatus }: Props) => {
  const { coreAddress, conditionId, outcomeId } = selection

  const { contracts } = useChain()
  const { prematchClient } = useApolloClients()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useSocket()
  const publicClient = usePublicClient()

  const isLive = coreAddress.toLowerCase() === liveHostAddress.toLowerCase()

  const [ odds, setOdds ] = useState(initialOdds || 0)
  const [ isOddsFetching, setOddsFetching ] = useState(!initialOdds)

  const [ status, setStatus ] = useState(initialStatus || ConditionStatus.Created)
  const [ isStatusFetching, setStatusFetching ] = useState(!initialStatus)

  const isLocked = status !== ConditionStatus.Created

  useEffect(() => {
    if (!isLive || !isSocketReady) {
      return
    }

    batchSocketSubscribe(String(conditionId), subscribeToUpdates)

    return () => {
      batchSocketUnsubscribe(String(conditionId), unsubscribeToUpdates)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = oddsWatcher.subscribe(`${conditionId}`, `${outcomeId}`, async (oddsData?: OddsChangedData) => {
      let odds: string | number | undefined = oddsData?.outcomes?.[String(outcomeId)]?.odds

      if (!odds) {
        const rawOdds = await publicClient.readContract({
          address: contracts.prematchCore.address,
          abi: contracts.prematchCore.abi,
          functionName: 'calcOdds',
          args: [
            BigInt(conditionId),
            BigInt(1),
            BigInt(outcomeId),
          ],
        })

        odds = formatUnits(rawOdds, ODDS_DECIMALS)
      }
      else {
        setOddsFetching(false)
      }

      setOdds(+odds)
    })

    return () => {
      unsubscribe()
    }
  }, [ publicClient ])

  useEffect(() => {
    const unsubscribe = conditionStatusWatcher.subscribe(`${conditionId}`, (newStatus: ConditionStatus) => {
      setStatusFetching(false)
      setStatus(newStatus)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isLive || (initialOdds && initialStatus)) {
      return
    }

    ;(async () => {
      const conditionEntityId = `${contracts.prematchCore.address.toLowerCase()}_${conditionId}`
      const key = `${conditionEntityId}-${outcomeId}`
      const data = await batchFetchOutcome(conditionEntityId, prematchClient!)

      if (!initialOdds) {
        setOdds(data?.[key]?.odds || 0)
        setOddsFetching(false)
      }

      if (!initialStatus) {
        setStatus(data?.[key]?.status || ConditionStatus.Created)
        setStatusFetching(false)
      }
    })()
  }, [ prematchClient ])

  return {
    odds,
    isLocked,
    isOddsFetching,
    isStatusFetching,
  }
}
