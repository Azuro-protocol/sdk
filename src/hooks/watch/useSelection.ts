import { useEffect, useState } from 'react'
import { formatUnits } from 'viem'
import { useConfig } from 'wagmi'
import { readContract } from '@wagmi/core'
import { type Selection, ConditionStatus, ODDS_DECIMALS, liveHostAddress } from '@azuro-org/toolkit'

import { oddsWatcher } from '../../modules/oddsWatcher'
import { useChain } from '../../contexts/chain'
import { useApolloClients } from '../../contexts/apollo'
import { useSocket, type OddsChangedData } from '../../contexts/socket'
import { conditionStatusWatcher } from '../../modules/conditionStatusWatcher'
import { batchFetchOutcomes } from '../../helpers/batchFetchOutcomes'


type Props = {
  selection: Selection
  initialOdds?: number
  initialStatus?: ConditionStatus
}

export const useSelection = ({ selection, initialOdds, initialStatus }: Props) => {
  const { coreAddress, conditionId, outcomeId } = selection

  const { appChain, contracts } = useChain()
  const { prematchClient } = useApolloClients()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useSocket()
  const config = useConfig()

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

    subscribeToUpdates([ conditionId ])

    return () => {
      unsubscribeToUpdates([ conditionId ])
    }
  }, [ isSocketReady ])

  useEffect(() => {
    const unsubscribe = oddsWatcher.subscribe(`${conditionId}`, `${outcomeId}`, async (oddsData?: OddsChangedData) => {
      let odds: string | number | undefined = oddsData?.outcomes?.[String(outcomeId)]?.odds

      if (!odds) {
        const rawOdds = await readContract(config, {
          address: contracts.prematchCore.address,
          abi: contracts.prematchCore.abi,
          functionName: 'calcOdds',
          chainId: appChain.id,
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
  }, [ config ])

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
      const key = `${conditionId}-${outcomeId}`
      const data = await batchFetchOutcomes([ conditionEntityId ], prematchClient!)

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
