import { useChainId } from 'wagmi'
import { chainsData } from '../config'


export const useBetToken = () => {
  const chainId = useChainId()
  const chainData = chainsData[chainId]

  if (!chainData) {
    console.error(`Selected network not supported.`)
    return
  }

  return chainData.betToken
}
