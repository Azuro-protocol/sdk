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
    listener(log) {
      // @ts-ignore
      const conditionId = log.args.conditionId!

      oddsWatcher.dispatch(appChain.id, conditionId)
    },
  })

  const unwatchCombo = useContractEvent({
    address: contracts.prematchCore.address,
    abi: contracts.prematchCore.abi,
    eventName: 'OddsChanged',
    listener(log) {
      // @ts-ignore
      const conditionId = log.args.conditionId!

      oddsWatcher.dispatch(appChain.id, conditionId)
    },
  })

  useEffect(() => {

    return () => {
      unwatchSingle?.()
      unwatchCombo?.()
    }
  }, [ unwatchSingle, unwatchCombo ])
}
