import { useContext } from 'react'
import { ChainContext, type ChainContextValue } from '../contexts/chain'


export const useChain = () => {
  return useContext(ChainContext) as ChainContextValue
}
