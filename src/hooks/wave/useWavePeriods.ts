import { useQuery } from '@tanstack/react-query'

import { getWavePeriods } from '../../utils/wave/getWavePeriods'
import { useChain } from '../../contexts/chain'


export type WavePeriod = {
  id: number
  startsAt: number
  endsAt: number
  totalPoints: string
  isBonusPreCalc: boolean
}

type Props = {
  waveId: number
}

export const useWavePeriods = ({ waveId }: Props) => {
  const { appChain, api } = useChain()

  const queryFn = async () => {
    const data = await getWavePeriods({
      waveId,
      chainId: appChain.id,
    })

    return [ ...data ].reverse().map<WavePeriod>(({ id, startsAt, endsAt, totalPoints }, index) => {
      const fromTimestamp = new Date(startsAt).getTime()
      const toTimestamp = new Date(endsAt).getTime() - 1000

      return {
        id,
        startsAt: Math.floor(fromTimestamp / 1000),
        endsAt: Math.floor(toTimestamp / 1000),
        totalPoints,
        isBonusPreCalc: !index,
      }
    })
  }

  return useQuery({
    queryKey: [ 'wave/periods', waveId, api ],
    queryFn,
    refetchOnWindowFocus: false,
  })
}
