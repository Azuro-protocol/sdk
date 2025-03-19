import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

import { useChain } from './chain'


export type FeedSocketContextValue = {
  socket: WebSocket | undefined;
  isSocketReady: boolean;
};

const FeedSocketContext = createContext<FeedSocketContextValue | null>(null)

export const useFeedSocket = () => {
  return useContext(FeedSocketContext) as FeedSocketContextValue
}

export const FeedSocketProvider: React.FC<any> = ({ children }) => {
  const { socket: socketUrl } = useChain()
  const [ socket, setSocket ] = useState<WebSocket>()
  const isSocketReady = socket?.readyState === WebSocket.OPEN

  const prevSocketUrl = useRef(socketUrl)
  const isConnectedRef = useRef(false)

  const connect = () => {
    if (isConnectedRef.current) {
      return
    }

    isConnectedRef.current = true

    const newSocket = new WebSocket(`${socketUrl}/feed`)

    const handleOpen = () => {
      setSocket(newSocket)
    }
    const handleClose = () => {
      setSocket(undefined)
      isConnectedRef.current = false

      newSocket.removeEventListener('open', handleOpen)
      newSocket.removeEventListener('close', handleClose)
      newSocket.removeEventListener('error', handleError)
      setTimeout(connect, 1000)
    }
    const handleError = () => {
      isConnectedRef.current = false
    }

    newSocket.addEventListener('open', handleOpen)
    newSocket.addEventListener('close', handleClose)
    newSocket.addEventListener('error', handleError)
  }

  useEffect(() => {
    connect()

    return () => {
      socket?.close()
    }
  }, [])

  useEffect(() => {
    if (!socket || !isSocketReady || prevSocketUrl.current === socketUrl) {
      return
    }

    socket.close()
    prevSocketUrl.current = socketUrl
  }, [ socketUrl, isSocketReady ])

  const value: FeedSocketContextValue = { socket, isSocketReady }

  return (
    <FeedSocketContext.Provider value={value}>
      {children}
    </FeedSocketContext.Provider>
  )
}
