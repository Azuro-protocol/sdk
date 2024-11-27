import { debounce } from './debounce'


type Action = 'subscribe' | 'unsubscribe'

export const createQueueAction = (subscribe: Function, unsubscribe: Function) => {
  const actions = {
    subscribe: [] as string[],
    unsubscribe: [] as string[],
  }

  const run = (action: Action, gameIds: string[]) => {
    // group batch requests
    const request = debounce(() => {
      const subscribeQueue = [ ...actions.subscribe ]
      const unsubscribeQueue = [ ...actions.unsubscribe ]

      actions.subscribe = []
      actions.unsubscribe = []

      const weights: Record<string, number> = {}

      subscribeQueue.forEach(id => {
        if (!weights[id]) {
          weights[id] = 1
        }
        else {
          weights[id]++
        }
      })

      unsubscribeQueue.forEach(id => {
        if (!weights[id]) {
          weights[id] = -1
        }
        else {
          weights[id]--
        }
      })

      const { shouldSubscribe, shouldUnsubscribe } = Object.keys(weights).reduce((acc, id) => {
        if (weights[id]! > 0) {
          acc.shouldSubscribe.push(id)
        }
        else if (weights[id]! < 0) {
          acc.shouldUnsubscribe.push(id)
        }

        return acc
      }, {
        shouldSubscribe: [] as string[],
        shouldUnsubscribe: [] as string[],
      })

      if (shouldSubscribe.length) {
        subscribe(shouldSubscribe)
      }

      if (shouldUnsubscribe.length) {
        unsubscribe(shouldUnsubscribe)
      }
    }, 50)

    request()
    gameIds.forEach(id => {
      actions[action].push(id)
    })
  }

  return run
}
