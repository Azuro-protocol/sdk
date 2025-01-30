import React, { useContext, createContext, useState, useMemo } from 'react'
import { useChains } from 'wagmi'
import type { ChainId } from '@azuro-org/toolkit'
import { chainsData } from '@azuro-org/toolkit'

import { cookieKeys } from '../config'
import { useChain } from './chain'


export type LiveContextValue = {
  isLive: boolean
  changeLive: (value: boolean) => void
}

export const LiveContext = createContext<LiveContextValue | null>(null)

export const useLive = () => {
  return useContext(LiveContext) as LiveContextValue
}

export type LiveProviderProps = {
  children: React.ReactNode
  initialLiveState?: boolean
}

export const LiveProvider: React.FC<LiveProviderProps> = (props) => {
  const { children, initialLiveState } = props

  const { appChain, setAppChainId, contracts } = useChain()
  const chains = useChains()

  const isLiveExist = Boolean(contracts.liveCore)
  const [ isLive, setLive ] = useState(isLiveExist && Boolean(initialLiveState))

  useMemo(() => {
    if (!isLiveExist && isLive) {
      setLive(false)
      document.cookie = `${cookieKeys.live}=false;path=/;`
    }
  }, [ appChain ])

  const handleChangeLive = (value: boolean) => {
    document.cookie = `${cookieKeys.live}=${value};path=/;`

    if (value && !isLiveExist) {
      const chainWithLive = chains.find(({ id }) => Boolean(chainsData[id as ChainId]?.contracts?.liveCore))

      if (chainWithLive) {
        setAppChainId(chainWithLive.id as ChainId)
      }
    }
    setLive(value)
  }

  const value = {
    isLive,
    changeLive: handleChangeLive,
  }

  return (
    <LiveContext.Provider value={value}>
      {children}
    </LiveContext.Provider>
  )
}
