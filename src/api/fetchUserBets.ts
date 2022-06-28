import { utils } from 'ethers'
import { formatUnits } from '@ethersproject/units'

import fetchGameIpfsData from './fetchGameIpfsData'
import type { FormattedIpfsData } from './fetchGameIpfsData'
import type { ConditionGameData } from './fetchConditions'
import { getContract, getRateDecimals, getTokenDecimals } from '../contracts'
import betTypeOdd from '../helpers/betTypeOdd'
import { ConditionStatus } from '../helpers/enums'


const fetchBet = async (nftId: number) => {
  const coreContract = getContract('core')

  try {
    // TODO take createdDate from bet - added on 7/19/21 by pavelivanov
    let { conditionId: rawConditionId, amount: rawAmount, outcome: rawOutcome, odds, payed, createdAt } = await coreContract.bets(nftId)
    const { scopeId, state, ipfsHash: ipfsHashHex, timestamp, outcomeWin } = await coreContract.getCondition(rawConditionId)

    const gameId = scopeId.toNumber()
    const conditionId = rawConditionId.toNumber()
    const ipfsHashArr = utils.arrayify(ipfsHashHex)
    const ipfsHash = utils.base58.encode([ 18, 32, ...ipfsHashArr ])

    const gameData = await fetchGameIpfsData(ipfsHash)

    if (!gameData) {
      return
    }

    const startsAt = timestamp.toNumber() * 1000
    const outcomeBetId = rawOutcome.toNumber()
    const outcomeWinId = outcomeWin.toNumber()

    const { marketRegistryId, outcomeRegistryId, paramId } = betTypeOdd[outcomeBetId]

    const rate = parseFloat(formatUnits(odds, await getRateDecimals()))
    const amount = parseFloat(formatUnits(rawAmount, await getTokenDecimals()))

    let result

    if (state === ConditionStatus.CANCELED) {
      result = amount
    }
    else if (outcomeWinId === 0) {
      result = null
    }
    else if (outcomeWinId === outcomeBetId) {
      result = (amount * rate).toFixed(6)
    }
    else {
      result = -1 * amount
    }

    const gameInfo: Omit<ConditionGameData, 'ipfsHashHex'> & FormattedIpfsData = {
      id: gameId,
      ...gameData,
      startsAt,
      state,
    }

    return {
      nftId,
      conditionId,
      paramId,
      marketRegistryId,
      outcomeRegistryId,
      rate,
      amount,
      result,
      createdAt: createdAt.toNumber() * 1000,
      isRedeemed: payed,
      gameInfo,
    }
  }
  catch (err) {
    console.error(err)
    return null
  }
}

type FetchUserBetsProps = {
  account: string
}

const fetchUserBets = async ({ account }: FetchUserBetsProps) => {
  try {
    let index = 0
    let prevResult
    const nftIds = []

    const betContract = getContract('bet')

    while (index === 0 || prevResult) {
      try {
        prevResult = await betContract.tokenOfOwnerByIndex(account, index++)

        nftIds.push(prevResult.toNumber())
      }
      catch (err) {
        // console.error(err)
        prevResult = null
      }
    }

    const bets = await Promise.all(nftIds.map(fetchBet))

    return bets.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt)
  }
  catch (err) {
    console.error(err)
    return []
  }
}

export default fetchUserBets
