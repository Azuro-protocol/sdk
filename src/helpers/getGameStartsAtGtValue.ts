import { configRef } from '../config'


type Ref = {
  lastUpdateTime: number | undefined
}

let ref: Ref = {
  lastUpdateTime: undefined,
}

export const getGameStartsAtGtValue = () => {
  let startsAt_gt: number
  const dateNow = Math.floor(Date.now() / 1000)

  // if first render or current time is greater the previous saved more than cache time
  if (
    !ref.lastUpdateTime
    || dateNow - ref.lastUpdateTime > configRef.gamesCacheTime
  ) {
    startsAt_gt = dateNow
    ref.lastUpdateTime = dateNow
  }
  else {
    startsAt_gt = ref.lastUpdateTime
  }

  return startsAt_gt
}
