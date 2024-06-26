import { polygon } from 'viem/chains'

import { getApiUrl, type ChainId } from '../../config'
import { type WaveId } from '../../global'


type Period = {
  id: number
  /** ISO String "2024-05-13T00:00:00.000Z" */
  startsAt: string
  /** ISO String "2024-05-20T00:00:00.000Z". It's a startsAt of next period */
  endsAt: string
  totalPoints: string
  waveId: number
}

export type WavePeriodsResponse = Period[]

type Props = {
  waveId?: WaveId
  chainId?: ChainId
}

export const getWavePeriods = async ({ waveId = 'active', chainId = polygon.id }: Props) => {
  const api = getApiUrl(chainId)

  const response = await fetch(`${api}/waves/${waveId}/periods`)
  const data: WavePeriodsResponse = await response.json()

  return data
}
