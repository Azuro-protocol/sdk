import { configRef } from '../config'


type Ref = {
  lastUpdateTime: number | undefined
}

let ref: Ref = {
  lastUpdateTime: undefined,
}

export const getGameStartsAtValue = () => {
  let startsAt: number
  const dateNow = Math.floor(Date.now() / 1000)

  // if first render or current time is greater the previous saved more than cache time
  if (
    !ref.lastUpdateTime
    || dateNow - ref.lastUpdateTime > configRef.gamesCacheTime
  ) {
    startsAt = dateNow
    ref.lastUpdateTime = dateNow
  }
  else {
    startsAt = ref.lastUpdateTime
  }

  return startsAt
}
