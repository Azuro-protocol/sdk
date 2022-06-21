import type { BigNumber } from 'ethers'

import { CONTRACTS, getContract } from '../contracts'


const approve = (amount: BigNumber) => {
  const tokenContract = getContract('token', true)

  return tokenContract.approve(CONTRACTS.lp.address, amount)
}

export default approve
