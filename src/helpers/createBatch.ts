import { debounce } from './debounce'


export const createBatch = <Result, T extends (ids: string[], ...rest: any) => Promise<Result | undefined> | Result | undefined>(fn: T, isSet = true): T => {
  let idsWaitList: Set<string> | string[] = isSet ? new Set<string>() : []
  let resolversWaitList: Array<(value?: Result) => void> = []

  const request = debounce(async (fn: T, ...rest) => {
    const ids = [ ...idsWaitList ]
    const resolvers = resolversWaitList

    if (idsWaitList instanceof Set) {
      idsWaitList.clear()
    }
    else {
      idsWaitList = []
    }
    resolversWaitList = []

    try {
      const data = await fn(ids, ...rest)

      resolvers.forEach((resolve) => {
        resolve(data)
      })
    }
    catch (err) {
      resolvers.forEach((resolve) => {
        resolve(undefined)
      })
    }
  }, 50)

  const batch = (ids: string[], ...rest: any) => {
    request(fn, ...rest)
    ids.forEach(id => {
      if (idsWaitList instanceof Set) {
        idsWaitList.add(id)
      }
      else {
        idsWaitList.push(id)
      }
    })

    return new Promise<Result | undefined>((resolve) => {
      resolversWaitList.push(resolve)
    })
  }

  return batch as T
}
