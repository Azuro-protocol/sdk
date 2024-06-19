import { getApiUrl, type ChainId } from '../../config'


export enum PointsLevelName {
  Grey = 'Grey',
  Mist = 'Mist',
  Sky = 'Sky',
  Blue = 'Blue',
  Ultramarine = 'Ultramarine',
  Bright = 'Bright',
  Brilliant = 'Brilliant',
  Royal = 'Royal',
}

export type LevelData = {
  level: number
  name: PointsLevelName
  boost: string
  pointsNeeded: string
  comment: string
}

type LevelsResponse = LevelData[]

type Props = {
  chainId: ChainId
  waveId: number
}

export const getWaveLevels = async ({ chainId, waveId }: Props) => {
  const api = getApiUrl(chainId)
  const response = await fetch(`${api}/waves/${waveId}/levels`)
  const data: LevelsResponse = await response.json()

  return [ ...data ].sort((a, b) => a.level - b.level)
}
