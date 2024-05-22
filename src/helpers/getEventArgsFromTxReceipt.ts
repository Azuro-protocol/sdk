import type { TransactionReceipt, Hex, DecodeEventLogReturnType } from 'viem'
import { decodeEventLog } from 'viem'


type Props = {
  receipt: TransactionReceipt
  eventName: string
  abi: Parameters<typeof decodeEventLog>[0]['abi']
  params?: Record<any, any>
}

export const getEventArgsFromTxReceipt = <T = Record<string, any>>({ receipt, eventName, abi, params }: Props): T | undefined => {
  let result: DecodeEventLogReturnType<typeof abi> = {} as any

  receipt.logs.forEach((log) => {
    try {
      const decodedLog = decodeEventLog({
        abi,
        topics: log.topics,
        eventName,
        data: log.data as Hex,
      })

      if (decodedLog?.args && params) {
        const isMatchByParams = Object.keys(params).every(paramKey => {
          return (decodedLog.args as any)[paramKey] === params[paramKey]
        })

        if (isMatchByParams) {
          result = decodedLog
        }
      }
      else {
        result = decodedLog
      }
    }
    catch {}
  })

  if (result?.args) {
    return result?.args as T
  }
}
