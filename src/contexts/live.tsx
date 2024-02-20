import React, { useContext, createContext, useState, useMemo } from 'react'
import { polygonMumbai } from 'viem/chains'

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

  const { appChain, setAppChainId } = useChain()
  const [ isLive, setLive ] = useState(appChain.id === polygonMumbai.id && Boolean(initialLiveState))

  useMemo(() => {
    if (appChain.id !== polygonMumbai.id && isLive) {
      setLive(false)
      document.cookie = `${cookieKeys.live}=false;path=/;`
    }
  }, [ appChain ])

  const handleChangeLive = (value: boolean) => {
    document.cookie = `${cookieKeys.live}=${value};path=/;`

    if (value && appChain.id !== polygonMumbai.id) {
      setAppChainId(polygonMumbai.id)
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
