import { useWatchContractEvent } from 'wagmi'
import { useChain } from '../contexts/chain'
import { oddsWatcher } from '../modules/oddsWatcher'
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher'
import { ConditionStatus } from '../docs/prematch/types'


export const useWatchers = () => {
  const { appChain, contracts } = useChain()

  useWatchContractEvent({
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

  useWatchContractEvent({
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

  useWatchContractEvent({
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
