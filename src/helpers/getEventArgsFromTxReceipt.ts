import { decodeEventLog } from 'viem'
import type { TransactionReceipt, Hex, ContractEventArgsFromTopics, ContractEventName, DecodeEventLogReturnType } from 'viem'
import type { Abi } from 'abitype'


type Props<AbiType, EventName> = {
  receipt: TransactionReceipt
  abi: AbiType
  eventName: EventName
  params?: Record<any, any>
}

export const getEventArgsFromTxReceipt = <
  AbiType extends Abi = Abi,
  EventNameType extends ContractEventName<AbiType> = ContractEventName<AbiType>,
>({ receipt, eventName, abi, params }: Props<AbiType, EventNameType>) => {
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

      if (result.eventName.toLowerCase() !== eventName.toLowerCase()) {
        result = undefined

        continue
      }

      if (params && result?.args) {
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
    return result?.args as ContractEventArgsFromTopics<AbiType, EventNameType>
  }
}
