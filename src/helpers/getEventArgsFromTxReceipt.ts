import type { TransactionReceipt, Hex, DecodeEventLogReturnType } from 'viem'
import { decodeEventLog } from 'viem'


type Props = {
  receipt: TransactionReceipt
  eventName: string
  abi: Parameters<typeof decodeEventLog>[0]['abi']
}

export const getEventArgsFromTxReceipt = <T = Record<string, any>>({ receipt, eventName, abi }: Props): T | undefined => {
  let result: DecodeEventLogReturnType = {} as any

  receipt.logs.some((log) => {
    try {
      const res = decodeEventLog({
        abi,
        topics: log.topics,
        eventName,
        data: log.data as Hex,
      })

      let isMatch = false

      if (res.eventName.toLowerCase() === eventName.toLowerCase()) {
        isMatch = true
      }

      if (isMatch) {
        result = res
      }

      return isMatch
    }
    catch {}
  })

  if (result?.args) {
    return result?.args as T
  }
}
