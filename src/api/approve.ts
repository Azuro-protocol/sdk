import type { BigNumber } from 'ethers'

import { CONTRACTS, getContract } from '../contracts'


const approve = (amount: BigNumber) => {
  const usdtContract = getContract('usdt', true)

  return usdtContract.approve(CONTRACTS.usdt.address, amount)
}

export default approve
