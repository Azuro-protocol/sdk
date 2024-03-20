import { debounce } from './debounce'


const createBatch = <Result, T extends (ids: string[], ...rest: any) => Promise<Result | undefined> | Result | undefined>(fn: T): T => {
  let idsWaitList = new Set<string>()
  let resolversWaitList: Array<(value?: Result) => void> = []

  const request = debounce(async (fn: T, ...rest) => {
    const ids = [ ...idsWaitList ]
    const resolvers = resolversWaitList

    idsWaitList.clear()
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
    ids.forEach(id => idsWaitList.add(id))

    return new Promise<Result | undefined>((resolve) => {
      resolversWaitList.push(resolve)
    })
  }

  return batch as T
}

export default createBatch
