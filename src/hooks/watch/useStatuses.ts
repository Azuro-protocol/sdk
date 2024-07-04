import { useEffect, useMemo, useState } from 'react'
import { type Selection, liveHostAddress } from '@azuro-org/toolkit'

import { useSocket } from '../../contexts/socket'
import { batchFetchConditions } from '../../helpers/batchFetchConditions'
import { useApolloClients } from '../../contexts/apollo'
import { conditionStatusWatcher } from '../../modules/conditionStatusWatcher'
import type { ConditionStatus } from '../../docs/prematch/types'


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

  const liveKey = liveItems.map(({ conditionId }) => conditionId).join('-')
  const selectionsKey = selections.map(({ conditionId }) => conditionId).join('-')

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

    setStatuses({})

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

    setPrematchStatusesFetching(true)

    ;(async () => {
      const { data: { conditions } } = await batchFetchConditions(prematchItems.map(({ conditionId }) => conditionId), prematchClient!)

      const prematchStatuses = conditions.reduce((acc, { conditionId, status }) => {
        acc[conditionId] = status

        return acc
      }, {} as Record<string, ConditionStatus>)

      setPrematchStatusesFetching(false)
      setStatuses(statuses => ({
        ...statuses,
        ...prematchStatuses,
      }))
    })()
  }, [ prematchItems ])

  return {
    statuses,
    loading: isPrematchStatusesFetching || isLiveStatusesFetching,
  }
}
