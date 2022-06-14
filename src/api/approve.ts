import type { BigNumber } from 'ethers'

import { CONTRACTS, getContract } from '../contracts'


const approve = (amount: BigNumber) => {
  const usdtContract = getContract('usdt', true)

  return usdtContract.approve(CONTRACTS.lp.address, amount)
}

export default approve
