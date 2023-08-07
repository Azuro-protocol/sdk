import { type ChainId } from '../config'
import { calcOdds } from '../utils/calcOdds'


type Handler = {
  outcomeId: bigint
  cb: (odds: bigint) => void
}

const timers = new Map<bigint, number>()
const subscribers = new Map<string, Handler[]>()

const subscribe = (conditionId: bigint, outcomeId: bigint, cb: () => bigint) => {
  const key = conditionId.toString()
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

const trigger = (chainId: ChainId, conditionId: bigint) => {
  const handlers = subscribers.get(`${conditionId}`) || []

  handlers.forEach(async ({ outcomeId, cb }) => {
    try {
      const odds = await calcOdds({
        chainId,
        conditionId,
        outcomeId,
      })

      if (odds !== undefined) {
        cb(odds)
      }
    }
    catch (err) {
      console.error(err)
    }
  })
}

const dispatch = (chainId: ChainId, conditionId: bigint) => {
  let timer = timers.get(conditionId)

  if (timer !== undefined) {
    clearTimeout(timer)
  }

  timer = +setTimeout(() => {
    timers.delete(conditionId)
    trigger(chainId, conditionId)
  }, 200)

  timers.set(conditionId, timer)
}

export const oddsWatcher = {
  subscribe,
  dispatch,
}
