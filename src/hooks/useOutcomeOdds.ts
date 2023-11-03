import { useEffect, useState } from 'react'
import { oddsWatcher } from '../modules/oddsWatcher';
import {formatUnits} from 'viem';
import { ODDS_DECIMALS } from '../config'
import { usePublicClient } from 'wagmi'
import {useChain} from '../contexts/chain';
import { Selection } from '../global';


type Props = {
  selection: Selection
  initialOdds?: string
}

export const useOutcomeOdds = ({ selection, initialOdds }: Props) => {
  const { conditionId, outcomeId } = selection
  const { contracts } = useChain()
  const publicClient = usePublicClient()

  const [ odds, setOdds ] = useState(initialOdds || '0')


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

  return odds
}
