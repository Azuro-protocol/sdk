type Cb = () => void

type Handler = {
  outcomeId: string
  cb: Cb
}

const timers = new Map<string, NodeJS.Timeout>()
const subscribers = new Map<string, Handler[]>()

const subscribe = (conditionId: string, outcomeId: string, cb: Cb) => {
  const key = conditionId
  const handlers = subscribers.get(key) || []

  handlers.push({ outcomeId, cb })
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

const trigger = async (conditionId: string) => {
  const handlers = subscribers.get(conditionId) || []

  handlers.forEach(({ cb }) => {
    cb()
  })
}

const dispatch = (conditionId: string) => {
  let timer = timers.get(conditionId)

  if (timer !== undefined) {
    clearTimeout(timer)
  }

  timer = setTimeout(() => {
    timers.delete(conditionId)
    trigger(conditionId)
  }, 200)

  timers.set(conditionId, timer)
}

export const oddsWatcher = {
  subscribe,
  dispatch,
}
