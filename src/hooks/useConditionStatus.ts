import { useEffect, useState } from 'react'
import { ConditionStatus } from '../types';
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher';


type Props = {
  conditionId: string
  initialStatus?: ConditionStatus
}

export const useConditionStatus = ({ conditionId, initialStatus }: Props) => {
  const [ status, setStatus ] = useState(initialStatus || ConditionStatus.Created)


  useEffect(() => {
    const unsubscribe = conditionStatusWatcher.subscribe(conditionId, (newStatus: ConditionStatus) => {
      setStatus(newStatus)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return status
}
