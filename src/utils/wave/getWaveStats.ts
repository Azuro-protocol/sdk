import { type Address } from 'viem'
import { polygon } from 'viem/chains'

import { getApiUrl, type ChainId } from '../../config'
import { type WaveLevelData } from './getWaveLevels'


export type WaveStatsResponse = {
  address: Address
  waveId: number
  levelActivated: boolean
  initialLevel: number
  level: number

  // points by categories
  betPoints: string
  dexPoints: string
  liqudityPoints: string
  stakingPoints: string
  leaderboardPoints: string
  manualPoints: string
  /** "2.100000", final points without level multiplier */
  points: string
  /** "2.100000", final points with level multiplier ('boost') */
  multipliedPoints: string

  sharePercent: string
  levelDescription: WaveLevelData
}


type Props = {
  account: Address
  waveId: number
  chainId?: ChainId
}

export const getWaveStats = async ({ account, waveId, chainId = polygon.id }: Props) => {
  const api = getApiUrl(chainId)

  const response = await fetch(`${api}/waves/${waveId}/participants/${account?.toLowerCase()}/stats`)
  const data: WaveStatsResponse = await response.json()
  const { address, multipliedPoints, levelActivated, ...rest } = data

  return {
    ...rest,
    totalMultipliedPoints: multipliedPoints,
    isActivated: levelActivated,
  }
}
