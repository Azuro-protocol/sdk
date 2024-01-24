import React, { useContext, createContext, useState, useMemo } from 'react'
import { setCookie } from 'cookies-next'
import { cookieKeys } from '../config'
import { useChain } from './chain'
import { polygonMumbai } from 'viem/chains'


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
      setCookie(cookieKeys.live, false)
    }
  }, [ appChain ])

  const handleChangeLive = (value: boolean) => {
    setCookie(cookieKeys.live, value)

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
