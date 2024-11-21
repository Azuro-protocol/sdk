import { useEffect, useMemo, useRef, useState } from 'react'
import { type Selection, type ConditionStatus, liveHostAddress } from '@azuro-org/toolkit'

import { useSocket } from '../../contexts/socket'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'
import { useApolloClients } from '../../contexts/apollo'
import { conditionStatusWatcher } from '../../modules/conditionStatusWatcher'


type ConditionsStatusesProps = {
  selections: Selection[]
}

export const useStatuses = ({ selections }: ConditionsStatusesProps) => {
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useSocket()
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

  const prevSelectionsRef = useRef(selections)
  const prevPrematchKey = useRef(prematchKey)

  if (prematchItems.length && prematchKey !== prevPrematchKey.current) {
    setPrematchStatusesFetching(true)
  }

  if (selections !== prevSelectionsRef.current) {
    setStatuses({})
  }

  prevSelectionsRef.current = selections
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
      const { data: { conditions } } = await batchFetchConditions(prematchItems.map(({ conditionId, coreAddress }) => `${coreAddress.toLowerCase()}_${conditionId}`), prematchClient!)

      const prematchStatuses = conditions.reduce((acc, { conditionId, status }) => {
        acc[conditionId] = status

        return acc
      }, {} as Record<string, ConditionStatus>)

      setPrematchStatusesFetching(false)
      setStatuses(prematchStatuses)
    })()
  }, [ prematchKey ])

  return {
    statuses,
    loading: isPrematchStatusesFetching || isLiveStatusesFetching,
  }
}
