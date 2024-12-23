import { useWatchContractEvent } from 'wagmi'
import { ConditionStatus } from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'
import { oddsWatcher } from '../../modules/oddsWatcher'
import { conditionStatusWatcher } from '../../modules/conditionStatusWatcher'


export const useWatchers = () => {
  const { appChain, contracts } = useChain()

  useWatchContractEvent({
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    eventName: 'NewBet',
    chainId: appChain.id,
    onLogs(logs) {
      if (logs) {
        logs.forEach(log => {
          const conditionId = log.args.conditionId!

          oddsWatcher.dispatch(conditionId.toString())
        })
      }
    },
  })

  useWatchContractEvent({
    address: contracts.prematchComboCore.address,
    abi: contracts.prematchComboCore.abi,
    eventName: 'NewBet',
    chainId: appChain.id,
    onLogs(logs) {
      if (logs) {
        logs.forEach(log => {
          const { subBets } = log.args.bet!

          subBets.forEach(({ conditionId }) => {
            oddsWatcher.dispatch(conditionId.toString())
          })
        })
      }
    },
  })

  useWatchContractEvent({
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    eventName: 'OddsChanged',
    chainId: appChain.id,
    onLogs(logs) {
      if (logs) {
        logs.forEach(log => {
          const conditionId = log.args.conditionId!

          oddsWatcher.dispatch(conditionId.toString())
        })
      }
    },
  })

  useWatchContractEvent({
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    eventName: 'ConditionStopped',
    chainId: appChain.id,
    onLogs(logs) {
      if (logs) {
        logs.forEach(log => {
          const conditionId = log.args.conditionId!
          const isStopped = log.args.flag!

          const status = isStopped ? ConditionStatus.Paused : ConditionStatus.Created

          conditionStatusWatcher.dispatch(conditionId.toString(), status)
        })
      }
    },
  })
}
