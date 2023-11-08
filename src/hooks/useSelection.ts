import { useEffect, useState } from 'react'
import { oddsWatcher } from '../modules/oddsWatcher';
import {formatUnits} from 'viem';
import { ODDS_DECIMALS } from '../config'
import { usePublicClient } from 'wagmi'
import {useChain} from '../contexts/chain';
import { Selection } from '../global';
import { ConditionStatus } from '../types';
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher';


type Props = {
  selection: Selection
  initialOdds?: string
  initialStatus?: ConditionStatus
}

export const useSelection = ({ selection, initialOdds, initialStatus }: Props) => {
  const { conditionId, outcomeId } = selection
  const { contracts } = useChain()
  const publicClient = usePublicClient()

  const [ odds, setOdds ] = useState(initialOdds || '0')
  const [ status, setStatus ] = useState(initialStatus || ConditionStatus.Created)

  const isLocked = status !== ConditionStatus.Created

  useEffect(() => {
    const unsubscribe = oddsWatcher.subscribe(`${conditionId}`, `${outcomeId}`, async () => {
      const rawOdds = await publicClient.readContract({
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

  return {
    odds,
    isLocked
  }
}
