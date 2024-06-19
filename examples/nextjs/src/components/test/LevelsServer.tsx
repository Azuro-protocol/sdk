import { ChainId } from '@azuro-org/sdk';
import { getWaveLevels } from '@azuro-org/sdk/utils';
import { cookies } from 'next/headers';
import { polygonAmoy } from 'viem/chains';

export const LevelsServer = async ({chainId}: {chainId: ChainId}) => {
  // const cookieStore = cookies()
  // const initialChainId = +(cookieStore.get('appChainId')?.value || polygonAmoy.id) as ChainId
  const levels = await getWaveLevels({ chainId, waveId: 1 })

  return (
    <>
      {
        levels.map(({name}) => (
          <div key={name} className="text-lg">{name}</div>
        ))
      }
    </>
  )
}
