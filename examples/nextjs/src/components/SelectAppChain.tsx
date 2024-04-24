'use client'
import { useChain, type ChainId } from '@azuro-org/sdk';
import { polygonAmoy, gnosis, polygon } from 'viem/chains';

export function SelectAppChain() {
  const { appChain, setAppChainId } = useChain()

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAppChainId(+event.target.value as ChainId)
  }

  return (
    <select className='mr-4 cursor-pointer' value={appChain.id} onChange={handleChange}>
      <option value={polygonAmoy.id}>{polygonAmoy.name}</option>
      <option value={gnosis.id}>{gnosis.name}</option>
      <option value={polygon.id}>{polygon.name}</option>
    </select>
  )
}
