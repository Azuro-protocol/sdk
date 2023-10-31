import { useEffect } from 'react'
import { useContractEvent } from 'wagmi'
import { useChain } from '../contexts/chain'
import { oddsWatcher } from '../modules/oddsWatcher'


export const useOddsWatcher = () => {
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

  useEffect(() => {

    return () => {
      unwatchSingle?.()
      unwatchCombo?.()
    }
  }, [ unwatchSingle, unwatchCombo, appChain.id ])
}
