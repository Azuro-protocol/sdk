import { polygon } from 'viem/chains'
import { formatUnits, parseUnits, type Address } from 'viem'

import { getApiUrl, type ChainId } from '../../config'
import { type WaveStatsResponse } from './getWaveStats'
import { type WaveLevelData } from './getWaveLevels'


type LeaderBoardTotalApiItem = WaveStatsResponse & {
  position: number
}

type LeaderBoardPeriodApiItem = {
  position: number
  address: Address
  points: string
  wavePeriodId: number
  sharePercent: string
  expectedPositionMultiplier: string
}

export type WaveLeaderBoardItem = {
  position: number
  address: Address
  points: string
  bonusPoints: string | null
  totalMultipliedPoints: string
  bonusMultiplier: number | null
  level: number | null
  levelDescription: WaveLevelData | null
}

type Props = {
  waveId: number
  account?: Address
  startsAt?: number
  chainId?: ChainId
}

export const getWaveLeaderBoard = async ({ waveId, account, startsAt, chainId = polygon.id }: Props) => {
  const api = getApiUrl(chainId)
  const baseUrl = `${api}/waves/${waveId}`
  let endpoint = startsAt
    ? `${baseUrl}/periods/${startsAt}/leaderboard`
    : `${baseUrl}/leaderboard`

  if (account) {
    endpoint += `?address=${account?.toLowerCase()}`
  }

  const response = await fetch(endpoint)
  const data: (LeaderBoardTotalApiItem | LeaderBoardPeriodApiItem)[] = await response.json()

  if (startsAt) {
    return (data as LeaderBoardPeriodApiItem[]).map<WaveLeaderBoardItem>((item) => {
      const { address, points, position, expectedPositionMultiplier } = item

      const rawPoints = parseUnits(points, 12)
      const rawMultipliedPoints = parseUnits(points, 12) * parseUnits(expectedPositionMultiplier, 12)

      const bonusPoints = formatUnits(rawMultipliedPoints - rawPoints, 24)
      const totalMultipliedPoints = formatUnits(rawMultipliedPoints, 24)

      return {
        position,
        address,
        points,
        bonusPoints,
        totalMultipliedPoints,
        bonusMultiplier: +expectedPositionMultiplier,
        level: null,
        levelDescription: null,
      }
    })
  }

  return (data as LeaderBoardTotalApiItem[]).map<WaveLeaderBoardItem>((item) => {
    const { address, points, position, level, levelDescription, multipliedPoints: totalMultipliedPoints } = item

    return {
      position,
      address,
      points,
      bonusPoints: null,
      bonusMultiplier: null,
      totalMultipliedPoints,
      level,
      levelDescription,
    }
  })
}
