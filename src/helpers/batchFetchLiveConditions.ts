// import { createBatch } from './createBatch'
// import { type OddsSocketData } from '../contexts/oddsSocket'


// type Result = Record<string, OddsSocketData[0]>

// const getConditions = async (conditionIds: string[], api: string): Promise<Record<string, OddsSocketData[0]>> => {
//   const response = await fetch(`${api}/conditions`, {
//     method: 'POST',
//     headers: {
//       'Accept': 'application/json',
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       ids: [ ...conditionIds ],
//     }),
//   })

//   const data: OddsSocketData = await response.json()

//   if (response.status === 404 || !response.ok) {
//     return {}
//   }

//   return data?.reduce<Record<string, OddsSocketData[0]>>((acc, condition) => {
//     const { id: conditionId } = condition

//     acc[conditionId] = condition

//     return acc
//   }, {})
// }

// type Func = typeof getConditions

// export const batchFetchLiveConditions = createBatch<Result, Func>(getConditions)
