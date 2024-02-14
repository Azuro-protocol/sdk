import { useWatchContractEvent, UseWatchContractEventReturnType } from 'wagmi'
import { useChain } from '../contexts/chain'
import { oddsWatcher } from '../modules/oddsWatcher'
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher'
import { ConditionStatus } from 'src/types'


export const useWatchers = () => {
  const { appChain, contracts } = useChain()

  const unwatchSingle = useWatchContractEvent({
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    eventName: 'NewBet',
    chainId: appChain.id,
    onLogs(logs) {
      const log = logs[0]!
      const conditionId = log.args.conditionId!

      oddsWatcher.dispatch(conditionId.toString())
    },
  })

  const unwatchCombo = useWatchContractEvent({
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    eventName: 'OddsChanged',
    chainId: appChain.id,
    onLogs(logs) {
      const log = logs[0]!
      const conditionId = log.args.conditionId!

      oddsWatcher.dispatch(conditionId.toString())
    },
  })

  const unwatchConditionStopped = useWatchContractEvent({
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    eventName: 'ConditionStopped',
    chainId: appChain.id,
    onLogs(logs) {
      const log = logs[0]!
      const conditionId = log.args.conditionId!
      const isStopped = log.args.flag!
      
      const status = isStopped ? ConditionStatus.Paused : ConditionStatus.Created

      conditionStatusWatcher.dispatch(conditionId.toString(), status)
    },
  })
}
