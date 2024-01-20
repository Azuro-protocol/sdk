import type { SocketContextValue } from '../contexts/socket'
import { debounce } from './debounce'


let idsWaitList = new Set<string>()

const unsubscribe = debounce(async (unsubscribeToUpdates: SocketContextValue['unsubscribeToUpdates']) => {
  const conditionEntityIds = [ ...idsWaitList ]

  idsWaitList.clear()

  unsubscribeToUpdates(conditionEntityIds)
}, 50)

const batchSocketUnsubscribe = (conditionEntityId: string, unsubscribeToUpdates: SocketContextValue['unsubscribeToUpdates']) => {
  unsubscribe(unsubscribeToUpdates)
  idsWaitList.add(conditionEntityId)
}

export default batchSocketUnsubscribe
