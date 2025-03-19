import { useEffect, useMemo, useRef, useState } from 'react'
import { type Selection, type ConditionState } from '@azuro-org/toolkit'

import { useConditionUpdates } from '../../contexts/conditionUpdates'
import { conditionStatusWatcher } from '../../modules/conditionStatusWatcher'
import { batchFetchOutcomes } from '../../helpers/batchFetchOutcomes'
import { useChain } from '../../contexts/chain'


type Props = {
  selections: Selection[]
}

export const useSelectionsState = ({ selections }: Props) => {
  const { graphql } = useChain()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()

  const [ states, setStates ] = useState<Record<string, ConditionState>>({})

  const [ isStatesFetching, setStatesFetching ] = useState(Boolean(selections.length))

  const selectionsKey = useMemo(() => (
    selections.map(({ conditionId }) => conditionId).join('-')
  ), [ selections ])

  const prevSelectionsKeyRef = useRef(selectionsKey)

  if (selections.length && selectionsKey !== prevSelectionsKeyRef.current) {
    setStatesFetching(true)
    setStates({})
  }

  prevSelectionsKeyRef.current = selectionsKey

  useEffect(() => {
    if (!isSocketReady || !selections.length) {
      return
    }

    const ids = selectionsKey.split('-')

    subscribeToUpdates(ids)

    return () => {
      unsubscribeToUpdates(ids)
    }
  }, [ selectionsKey, isSocketReady ])

  useEffect(() => {
    if (!selections.length) {
      return
    }

    const unsubscribeList = selections.map(({ conditionId }) => {
      return conditionStatusWatcher.subscribe(conditionId, (newStatus) => {
        setStates(states => ({
          ...states,
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
    if (!selections.length) {
      return
    }

    ;(async () => {
      const data = await batchFetchOutcomes(selectionsKey.split('-'), graphql.feed)

      const prematchStatuses = (selections || []).reduce<Record<string, ConditionState>>((acc, selection) => {
        const { conditionId, outcomeId } = selection || {}
        const key = `${conditionId}-${outcomeId}`

        if (conditionId && data?.[key]) {
          acc[conditionId] = data[key].state
        }

        return acc
      }, {})

      setStatesFetching(false)
      setStates(prematchStatuses)
    })()
  }, [ selectionsKey ])

  return {
    states,
    isFetching: isStatesFetching,
  }
}
