import { type ConditionStatus } from '@azuro-org/toolkit'


type Cb = (status: ConditionStatus) => void

type Handler = {
  cb: Cb
}

const timers = new Map<string, NodeJS.Timeout>()
const subscribers = new Map<string, Handler[]>()

const subscribe = (conditionId: string, cb: Cb) => {
  const key = conditionId
  const handlers = subscribers.get(key) || []

  handlers.push({ cb })
  subscribers.set(key, handlers)

  return function unsubscribe() {
    const handlers = subscribers.get(key) || []
    const newHandlers = handlers.filter((handler) => handler.cb !== cb)

    if (newHandlers.length) {
      subscribers.set(key, newHandlers)
    }
    else {
      subscribers.delete(key)
    }
  }
}

const trigger = (conditionId: string, status: ConditionStatus) => {
  const handlers = subscribers.get(conditionId) || []

  handlers.forEach(({ cb }) => {
    cb(status)
  })
}

const dispatch = (conditionId: string, status: ConditionStatus) => {
  let timer = timers.get(conditionId)

  if (timer !== undefined) {
    clearTimeout(timer)
  }

  timer = setTimeout(() => {
    timers.delete(conditionId)
    trigger(conditionId, status)
  }, 200)

  timers.set(conditionId, timer)
}

export const conditionStatusWatcher = {
  subscribe,
  dispatch,
}
