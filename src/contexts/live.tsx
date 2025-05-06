import React, { useContext, createContext, useState } from 'react'

import { cookieKeys } from '../config'


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

  const [ isLive, setLive ] = useState(Boolean(initialLiveState))

  const handleChangeLive = (value: boolean) => {
    document.cookie = `${cookieKeys.live}=${value};path=/;`
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
