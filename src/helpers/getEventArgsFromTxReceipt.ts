import type { TransactionReceipt, Hex, DecodeEventLogReturnType } from 'viem'
import { decodeEventLog } from 'viem'


type Props = {
  receipt: TransactionReceipt
  eventName: string
  abi: Parameters<typeof decodeEventLog>[0]['abi']
  params?: Record<any, any>
}

export const getEventArgsFromTxReceipt = <T = Record<string, any>>({ receipt, eventName, abi, params }: Props): T | undefined => {
  const { logs } = receipt
  let result: DecodeEventLogReturnType<typeof abi> | undefined

  for (let index = 0; index < logs.length; index++) {
    try {
      const log = logs[index]!
      result = decodeEventLog({
        abi,
        topics: log.topics,
        eventName,
        data: log.data as Hex,
      })

      if (result?.args && params) {
        const isMatchByParams = Object.keys(params).every(paramKey => {
          return (result!.args as any)[paramKey] === params[paramKey]
        })

        if (!isMatchByParams) {
          result = undefined
        }
      }

      if (result) {
        break
      }
    }
    catch {}
  }

  if (result?.args) {
    return result?.args as T
  }
}
