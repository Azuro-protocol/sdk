import { debounce } from './debounce'


type Settler<Result> = {
  resolve: (value: Result) => void
  reject: (reason?: unknown) => void
}

export const createBatch = <Result, T extends (ids: string[], ...rest: any) => Promise<Result> | Result>(fn: T, isSet = true): T => {
  let idsWaitList: Set<string> | string[] = isSet ? new Set<string>() : []
  let settlersWaitList: Array<Settler<Result>> = []

  const request = debounce(async (fn: T, ...rest) => {
    const ids = [ ...idsWaitList ]
    const settlers = settlersWaitList

    if (idsWaitList instanceof Set) {
      idsWaitList.clear()
    }
    else {
      idsWaitList = []
    }
    settlersWaitList = []

    try {
      const data = await fn(ids, ...rest)

      settlers.forEach(({ resolve }) => {
        resolve(data)
      })
    }
    catch (err) {
      settlers.forEach(({ reject }) => {
        reject(err)
      })
    }
  }, 50, true)

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

    return new Promise<Result>((resolve, reject) => {
      settlersWaitList.push({ resolve, reject })
    })
  }

  return batch as T
}
