import { debounce } from './debounce'


type Action = 'subscribe' | 'unsubscribe'

export const createQueueAction = (subscribe: Function, unsubscribe: Function) => {
  const actions = {
    subscribe: [] as string[],
    unsubscribe: [] as string[],
  }

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

    const { subscribeWeights, unsubscribeWeights } = Object.keys(weights).reduce((acc, id) => {
      // ATTN: equal cause we need to fire subscribe for new elements and then trigger watcher (we don't have store)
      if (weights[id]! >= 0) {
        acc.subscribeWeights[id] = weights[id]!
      }
      else if (weights[id]! < 0) {
        acc.unsubscribeWeights[id] = weights[id]!
      }

      return acc
    }, {
      subscribeWeights: {} as Record<string, number>,
      unsubscribeWeights: {} as Record<string, number>,
    })

    if (Object.keys(subscribeWeights).length) {
      subscribe(subscribeWeights)
    }

    if (Object.keys(unsubscribeWeights).length) {
      unsubscribe(unsubscribeWeights)
    }
  }, 50)

  const run = (action: Action, values: string[]) => {
    request()
    values.forEach(value => {
      actions[action].push(value)
    })
  }

  return run
}
