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

type Props = {
  children: React.ReactNode
  initialState?: boolean
}

export const LiveProvider: React.FC<Props> = (props) => {
  const { children, initialState } = props

  const { appChain, setAppChainId } = useChain()
  const [ isLive, setLive ] = useState(appChain.id === polygonMumbai.id && Boolean(initialState))

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
