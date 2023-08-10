import { configRef } from '../config'

export const setGamesCacheTime = (cacheTime: number) => {
  configRef.gamesCacheTime = cacheTime
}
