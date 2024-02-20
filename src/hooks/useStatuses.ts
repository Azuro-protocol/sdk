import { useEffect, useMemo, useState } from 'react'

import { liveHostAddress } from '../config'
import type { Selection } from '../global'
import { useSocket } from '../contexts/socket'
import { batchSocketSubscribe, batchSocketUnsubscribe } from '../helpers'
import { useApolloClients } from '../contexts/apollo'
import { type ConditionsQuery, ConditionsDocument } from '../docs/prematch/conditions'
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher'
import type { ConditionStatus } from '../docs/prematch/types'


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

  const isLiveStatusesFetching = useMemo(() => {
    return !liveItems.every(({ conditionId }) => Boolean(statuses[conditionId]))
  }, [ liveKey, statuses ])

  useEffect(() => {
    if (!isSocketReady || !liveItems.length) {
      return
    }

    liveItems.forEach(({ conditionId }) => {
      batchSocketSubscribe(conditionId, subscribeToUpdates)
    })

    return () => {
      liveItems.forEach(({ conditionId }) => {
        batchSocketUnsubscribe(conditionId, unsubscribeToUpdates)
      })
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
  }, [ selections ])

  useEffect(() => {
    if (!prematchItems.length) {
      return
    }

    setPrematchStatusesFetching(true)

    ;(async () => {
      const { data: { conditions } } = await prematchClient!.query<ConditionsQuery>({
        query: ConditionsDocument,
        variables: {
          where: {
            conditionId_in: prematchItems.map(({ conditionId }) => conditionId),
          },
        },
        fetchPolicy: 'network-only',
      })

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
