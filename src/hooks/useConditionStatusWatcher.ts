import { useEffect } from 'react'
import { useContractEvent } from 'wagmi'
import { useChain } from '../contexts/chain'
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher'
import { ConditionStatus } from 'src/types'


export const useConditionStatusWatcher = () => {
  const { appChain, contracts } = useChain()

  const unwatchConditionStopped = useContractEvent({
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    eventName: 'ConditionStopped',
    chainId: appChain.id,
    listener(logs) {
      const log = logs[0]!
      const conditionId = log.args.conditionId!
      const isStopped = log.args.flag!
      
      const status = isStopped ? ConditionStatus.Paused : ConditionStatus.Created

      conditionStatusWatcher.dispatch(conditionId.toString(), status)
    },
  })

  useEffect(() => {

    return () => {
      unwatchConditionStopped?.()
    }
  }, [ unwatchConditionStopped, contracts ])
}
