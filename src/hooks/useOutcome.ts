import { useEffect, useState } from 'react'
import { useApolloClient } from '@apollo/client';
import { oddsWatcher } from '../modules/oddsWatcher';
import {formatUnits} from 'viem';
import { ODDS_DECIMALS } from '../config'
import { usePublicClient } from 'wagmi'
import {useChain} from '../contexts/chain';
import { Selection } from '../global';
import { ConditionStatus } from '../types';
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher';
import { batchFetchOutcome } from '../helpers/batchFetchOutcome';


type Props = {
  selection: Selection
  initialOdds?: string
  initialStatus?: ConditionStatus
}

export const useOutcome = ({ selection, initialOdds, initialStatus }: Props) => {
  const { conditionId, outcomeId } = selection
  const { contracts } = useChain()
  const publicClient = usePublicClient()
  const apolloClient = useApolloClient()

  const [ odds, setOdds ] = useState(initialOdds || '0')
  const [isOddsFetching, setOddsFetching] = useState(!initialOdds)

  const [ status, setStatus ] = useState(initialStatus || ConditionStatus.Created)
  const [isStatusFetching, setStatusFetching] = useState(!initialStatus)

  const isLocked = status !== ConditionStatus.Created

  useEffect(() => {
    const unsubscribe = oddsWatcher.subscribe(`${conditionId}`, `${outcomeId}`, async () => {
      const rawOdds = await publicClient!.readContract({
        address: contracts.prematchCore.address,
        abi: contracts.prematchCore.abi,
        functionName: 'calcOdds',
        args: [
          BigInt(conditionId),
          BigInt(1),
          BigInt(outcomeId)
        ],
      })

      setOdds(formatUnits(rawOdds, ODDS_DECIMALS))
    })

    return () => {
      unsubscribe()
    }
  }, [ publicClient ])

  useEffect(() => {
    const unsubscribe = conditionStatusWatcher.subscribe(`${conditionId}`, (newStatus: ConditionStatus) => {
      setStatus(newStatus)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!initialOdds || !initialStatus) {
      ;(async () => {
        const conditionEntityId = `${contracts.prematchCore.address.toLowerCase()}_${conditionId}`
        const key = `${conditionEntityId}-${outcomeId}`
        const data = await batchFetchOutcome(conditionEntityId, apolloClient)

        if (!initialOdds) {
          setOdds(data?.[key]?.odds || '0')
          setOddsFetching(false)
        }

        if (!initialStatus) {
          setStatus(data?.[key]?.status || ConditionStatus.Created)
          setStatusFetching(false)
        }
      })()
    }
  }, [ apolloClient, contracts.prematchCore.address ])

  return {
    odds,
    isLocked,
    isOddsFetching,
    isStatusFetching,
  }
}
