import { useEffect } from 'react'
import { useNetwork, useContractEvent } from 'wagmi'
import { prematchCoreAbi } from '../config'
import { oddsWatcher } from '../modules/oddsWatcher'
import { useChainData } from './useChainData'


export const useOddsWatcher = () => {
  const { chain } = useNetwork()
  const chainData = useChainData()

  const unwatchSingle = useContractEvent({
    address: chainData?.addresses.prematchCore,
    abi: prematchCoreAbi,
    eventName: 'NewBet',
    listener(log) {
      // @ts-ignore
      const conditionId = log.args.conditionId!

      oddsWatcher.dispatch(chain!.id, conditionId)
    },
  })

  const unwatchCombo = useContractEvent({
    address: chainData?.addresses.prematchCore,
    abi: prematchCoreAbi,
    eventName: 'OddsChanged',
    listener(log) {
      // @ts-ignore
      const conditionId = log.args.conditionId!

      oddsWatcher.dispatch(chain!.id, conditionId)
    },
  })

  useEffect(() => {

    return () => {
      unwatchSingle?.()
      unwatchCombo?.()
    }
  }, [ unwatchSingle, unwatchCombo ])
}
