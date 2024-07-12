import { useState, useCallback } from 'react'


const useForceUpdate = () => {
  const [ increment, setState ] = useState(0)

  const forceUpdate = useCallback(() => {
    setState((v) => ++v)
  }, [])

  return { increment, forceUpdate }
}


export default useForceUpdate
