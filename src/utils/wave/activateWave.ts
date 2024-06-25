import { type Address } from 'viem'
import { polygon } from 'viem/chains'

import { getApiUrl, type ChainId } from '../../config'


type Props = {
  account: Address
  waveId: number
  chainId?: ChainId
}

export const activateWave = async ({ account, waveId, chainId = polygon.id }: Props) => {
  const api = getApiUrl(chainId)
  const response = await fetch(`${api}/waves/${waveId}/participants/${account?.toLowerCase()}/activate`)
  await response.json()
}
