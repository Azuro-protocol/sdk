export const createWatcher = <V>() => {
  type Cb = (value: V) => void

  const timers = new Map<string, NodeJS.Timeout>()
  const subscribers = new Map<string, Cb[]>()

  const trigger = (key: string, value: V) => {
    const handlers = subscribers.get(key) || []

    handlers.forEach((cb) => {
      cb(value)
    })
  }

  const subscribe = (key: string, cb: Cb) => {
    const handlers = subscribers.get(key) || []

    handlers.push(cb)
    subscribers.set(key, handlers)

    return function unsubscribe() {
      const handlers = subscribers.get(key) || []
      const newHandlers = handlers.filter((handler) => handler !== cb)

      if (newHandlers.length) {
        subscribers.set(key, newHandlers)
      }
      else {
        subscribers.delete(key)
      }
    }
  }

  const dispatch = (key: string, value: V) => {
    let timer = timers.get(key)

    if (timer !== undefined) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      timers.delete(key)
      trigger(key, value)
    }, 200)

    timers.set(key, timer)
  }

  return {
    subscribe,
    dispatch,
  }
}

