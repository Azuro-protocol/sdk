import { useRef, useEffect } from 'react'


const useIsMounted = (): () => boolean => {
  const isMountedRef = useRef<boolean>(false)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  return () => isMountedRef.current
}

export default useIsMounted
