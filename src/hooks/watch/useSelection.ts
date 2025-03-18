import { useEffect, useState } from 'react'
import { formatUnits } from 'viem'
import { useConfig } from 'wagmi'
import { readContract } from '@wagmi/core'
import { type Selection, ConditionState, ODDS_DECIMALS, liveHostAddress } from '@azuro-org/toolkit'

import { oddsWatcher } from '../../modules/oddsWatcher'
import { useChain } from '../../contexts/chain'
import { useOddsSocket, type OddsChangedData } from '../../contexts/oddsSocket'
import { conditionStatusWatcher } from '../../modules/conditionStatusWatcher'
import { batchFetchOutcomes } from '../../helpers/batchFetchOutcomes'


type Props = {
  selection: Selection
  initialOdds?: number
  initialState?: ConditionState
}

export const useSelection = ({ selection, initialOdds, initialState }: Props) => {
  const { conditionId, outcomeId } = selection

  const { graphql } = useChain()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useOddsSocket()
  const config = useConfig()

  const [ odds, setOdds ] = useState(initialOdds || 0)
  const [ isOddsFetching, setOddsFetching ] = useState(!initialOdds)

  const [ state, setState ] = useState(initialState || ConditionState.Active)
  const [ isStateFetching, setStateFetching ] = useState(!initialState)

  const isLocked = state !== ConditionState.Active

  useEffect(() => {
    if (!isSocketReady) {
      return
    }

    subscribeToUpdates([ conditionId ])

    return () => {
      unsubscribeToUpdates([ conditionId ])
    }
  }, [ isSocketReady ])

  useEffect(() => {
    const unsubscribe = oddsWatcher.subscribe(`${conditionId}`, async (oddsData) => {
      let odds: string | number | undefined = oddsData?.outcomes?.[String(outcomeId)]?.odds

      // if (!odds) {
      //   const rawOdds = await readContract(config, {
      //     address: contracts.prematchCore.address,
      //     abi: contracts.prematchCore.abi,
      //     functionName: 'calcOdds',
      //     chainId: appChain.id,
      //     args: [
      //       BigInt(conditionId),
      //       BigInt(1),
      //       BigInt(outcomeId),
      //     ],
      //   })

      //   odds = formatUnits(rawOdds, ODDS_DECIMALS)
      // }
      // else {
      //   setOddsFetching(false)
      // }

      setOdds(+odds!)
    })

    return () => {
      unsubscribe()
    }
  }, [ config ])

  useEffect(() => {
    const unsubscribe = conditionStatusWatcher.subscribe(`${conditionId}`, (newState: ConditionState) => {
      setStateFetching(false)
      setState(newState)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (initialOdds && initialState) {
      return
    }

    ;(async () => {
      const key = `${conditionId}-${outcomeId}`
      const data = await batchFetchOutcomes([ conditionId ], graphql.feed)

      if (!initialOdds) {
        setOdds(data?.[key]?.odds || 0)
        setOddsFetching(false)
      }

      if (!initialState) {
        setState(data?.[key]?.state || ConditionState.Active)
        setStateFetching(false)
      }
    })()
  }, [ graphql.feed ])

  return {
    odds,
    isLocked,
    isOddsFetching,
    isStateFetching,
  }
}
