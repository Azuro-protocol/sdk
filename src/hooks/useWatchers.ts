import { useEffect } from 'react'
import { useContractEvent } from 'wagmi'
import { useChain } from '../contexts/chain'
import { oddsWatcher } from '../modules/oddsWatcher'
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher'
import { ConditionStatus } from '../docs/prematch/types'


export const useWatchers = () => {
  const { appChain, contracts } = useChain()

  const unwatchSingle = useContractEvent({
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    eventName: 'NewBet',
    chainId: appChain.id,
    listener(logs) {
      const log = logs[0]!
      const conditionId = log.args.conditionId!

      oddsWatcher.dispatch(conditionId.toString())
    },
  })

  const unwatchCombo = useContractEvent({
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    eventName: 'OddsChanged',
    chainId: appChain.id,
    listener(logs) {
      const log = logs[0]!
      const conditionId = log.args.conditionId!

      oddsWatcher.dispatch(conditionId.toString())
    },
  })

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
      unwatchSingle?.()
      unwatchCombo?.()
    }
  }, [ unwatchSingle, unwatchCombo, appChain.id ])


  useEffect(() => {

    return () => {
      unwatchConditionStopped?.()
    }
  }, [ unwatchConditionStopped, contracts ])
}
