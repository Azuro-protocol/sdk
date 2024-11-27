import { useEffect, useMemo, useRef, useState } from 'react'
import { type Selection, type ConditionStatus, liveHostAddress } from '@azuro-org/toolkit'

import { useOddsSocket } from '../../contexts/oddsSocket'
import { useApolloClients } from '../../contexts/apollo'
import { conditionStatusWatcher } from '../../modules/conditionStatusWatcher'
import { batchFetchOutcomes } from '../../helpers/batchFetchOutcomes'


type ConditionsStatusesProps = {
  selections: Selection[]
}

export const useStatuses = ({ selections }: ConditionsStatusesProps) => {
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useOddsSocket()
  const { prematchClient } = useApolloClients()

  const [ statuses, setStatuses ] = useState<Record<string, ConditionStatus>>({})

  const { liveItems, prematchItems } = useMemo<{ liveItems: Selection[], prematchItems: Selection[] }>(() => {
    return selections.reduce((acc, item) => {
      if (item.coreAddress.toLocaleLowerCase() === liveHostAddress.toLocaleLowerCase()) {
        acc.liveItems.push(item)
      }
      else {
        acc.prematchItems.push(item)
      }

      return acc
    }, {
      liveItems: [],
      prematchItems: [],
    } as { liveItems: Selection[], prematchItems: Selection[] })
  }, [ selections ])

  const [ isPrematchStatusesFetching, setPrematchStatusesFetching ] = useState(Boolean(prematchItems.length))

  const selectionsKey = useMemo(() => (
    selections.map(({ conditionId }) => conditionId).join('-')
  ), [ selections ])
  const liveKey = useMemo(() => (
    liveItems.map(({ conditionId }) => conditionId).join('-')
  ), [ liveItems ])
  const prematchKey = useMemo(() => (
    prematchItems.map(({ conditionId }) => conditionId).join('-')
  ), [ prematchItems ])

  const prevSelectionsKeyRef = useRef(selectionsKey)
  const prevPrematchKey = useRef(prematchKey)

  if (prematchItems.length && prematchKey !== prevPrematchKey.current) {
    setPrematchStatusesFetching(true)
  }

  if (selectionsKey !== prevSelectionsKeyRef.current) {
    setStatuses({})
  }

  prevSelectionsKeyRef.current = selectionsKey
  prevPrematchKey.current = prematchKey

  const isLiveStatusesFetching = useMemo(() => {
    return !liveItems.every(({ conditionId }) => Boolean(statuses[conditionId]))
  }, [ liveKey, statuses ])

  useEffect(() => {
    if (!isSocketReady || !liveItems.length) {
      return
    }

    const ids = liveKey.split('-')

    subscribeToUpdates(ids)

    return () => {
      unsubscribeToUpdates(ids)
    }
  }, [ liveKey, isSocketReady ])

  useEffect(() => {
    if (!selections.length) {
      return
    }

    const unsubscribeList = selections.map(({ conditionId }) => {
      return conditionStatusWatcher.subscribe(conditionId, (newStatus) => {
        setStatuses(statuses => ({
          ...statuses,
          [conditionId]: newStatus,
        }))
      })
    })

    return () => {
      unsubscribeList.forEach((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [ selectionsKey ])

  useEffect(() => {
    if (!prematchItems.length) {
      return
    }

    ;(async () => {
      const data = await batchFetchOutcomes(prematchItems.map(({ conditionId, coreAddress }) => `${coreAddress.toLowerCase()}_${conditionId}`), prematchClient!)

      const prematchStatuses = selections.reduce<Record<string, ConditionStatus>>((acc, { conditionId, outcomeId }) => {
        const key = `${conditionId}-${outcomeId}`
        const { status } = data?.[key]!
        acc[conditionId] = status

        return acc
      }, {})

      setPrematchStatusesFetching(false)
      setStatuses(prematchStatuses)
    })()
  }, [ prematchKey ])

  return {
    statuses,
    loading: isPrematchStatusesFetching || isLiveStatusesFetching,
  }
}
