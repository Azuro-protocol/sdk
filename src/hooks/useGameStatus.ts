// import { useEffect, useMemo, useState } from 'react'
// import { getGameStatus, type GameStatus, type GraphGameStatus } from '@azuro-org/toolkit'


// type Props = {
//   startsAt: number
//   graphStatus: GraphGameStatus
//   isGameExistInLive: boolean
// }

// export const useGameStatus = ({ graphStatus, startsAt, isGameExistInLive }: Props) => {
//   const startDate = +startsAt * 1000
//   const [ isGameStarted, setGameStarted ] = useState(Date.now() > startDate)

//   const gameStatus = useMemo<GameStatus>(() => {
//     return getGameStatus({
//       graphStatus,
//       startsAt,
//       isGameInLive: isGameExistInLive,
//     })
//   }, [ graphStatus, isGameStarted, isGameExistInLive ])

//   useEffect(() => {
//     if (isGameStarted) {
//       return
//     }

//     const timer = setTimeout(() => {
//       setGameStarted(true)
//     }, startDate - Date.now())

//     return () => {
//       clearTimeout(timer)
//     }
//   }, [ startDate ])

//   return {
//     status: gameStatus,
//     isGameStarted,
//   }
// }
