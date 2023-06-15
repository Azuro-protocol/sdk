import { createPublicClient, http, parseAbiItem, type Log } from 'viem'
import { chainsData } from '../config'


type WatchOddsChangeProps = {
  chainId: number
  conditionIds?: string[]
  batch?: boolean
  onLogs?: (logs: Log[]) => void
}

export const watchOddsChange = (props: WatchOddsChangeProps) => {
  const chainData = chainsData[props.chainId]

  if (!chainData) {
    console.error(`Chain with passed ID not supported. Passed: ${props.chainId}`)
    return
  }

  const publicClient = createPublicClient({
    chain: chainData.chain,
    transport: http(),
  })

  const unwatchSingle = publicClient.watchEvent({
    address: chainData.addresses.prematchCore,
    event: parseAbiItem('event NewBet(address indexed bettor, address indexed affiliate, uint256 indexed conditionId, uint256 tokenId, uint64 outcomeId, uint128 amount, uint64 odds, uint128[2] funds)'),
    batch: props.batch,
    onLogs: (logs) => {
      props.onLogs?.(logs)
    },
  })

  const unwatchCombo = publicClient.watchEvent({
    address: chainData.addresses.prematchComboCore,
    event: parseAbiItem('event Transfer(uint256 indexed conditionId, uint64[2] newOdds)'),
    batch: props.batch,
    onLogs: (logs) => {
      props.onLogs?.(logs)
    },
  })

  return function unwatch() {
    unwatchSingle()
    unwatchCombo()
  }
}
