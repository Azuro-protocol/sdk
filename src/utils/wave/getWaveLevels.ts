import { polygon } from 'viem/chains'

import { getApiUrl, type ChainId } from '../../config'


export enum WaveLevelName {
  Grey = 'Grey',
  Mist = 'Mist',
  Sky = 'Sky',
  Blue = 'Blue',
  Ultramarine = 'Ultramarine',
  Bright = 'Bright',
  Brilliant = 'Brilliant',
  Royal = 'Royal',
}

export type WaveLevelData = {
  level: number
  name: WaveLevelName
  boost: string
  pointsNeeded: string
  comment: string
}

export type WaveLevelsResponse = WaveLevelData[]

type Props = {
  waveId: number
  chainId?: ChainId
}

export const getWaveLevels = async ({ waveId, chainId = polygon.id }: Props) => {
  const api = getApiUrl(chainId)
  const response = await fetch(`${api}/waves/${waveId}/levels`)
  const data: WaveLevelsResponse = await response.json()

  return [ ...data ].sort((a, b) => a.level - b.level)
}
