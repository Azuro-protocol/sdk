import type { SocketContextValue } from '../contexts/socket'
import { debounce } from './debounce'


let idsWaitList = new Set<string>()

const subscribe = debounce((subscribeToUpdates: SocketContextValue['subscribeToUpdates']) => {
  const conditionEntityIds = [ ...idsWaitList ]

  idsWaitList.clear()
  subscribeToUpdates(conditionEntityIds)
}, 50)

const batchSocketSubscribe = (conditionEntityId: string, subscribeToUpdates: SocketContextValue['subscribeToUpdates']) => {
  subscribe(subscribeToUpdates)
  idsWaitList.add(conditionEntityId)
}

export default batchSocketSubscribe
