import { type OddsChangedData } from '../contexts/socket'


type Cb = (oddsData?: OddsChangedData) => void

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

const trigger = async (conditionId: string, oddsData?: OddsChangedData) => {
  const handlers = subscribers.get(conditionId) || []

  handlers.forEach(({ cb }) => {
    cb(oddsData)
  })
}

const dispatch = (conditionId: string, oddsData?: OddsChangedData) => {
  let timer = timers.get(conditionId)

  if (timer !== undefined) {
    clearTimeout(timer)
  }

  timer = setTimeout(() => {
    timers.delete(conditionId)
    trigger(conditionId, oddsData)
  }, 200)

  timers.set(conditionId, timer)
}

export const oddsWatcher = {
  subscribe,
  dispatch,
}
