import type { BigNumber } from 'ethers'

import { CONTRACTS, getContract } from '../contracts'


const fetchAllowance = (account: string): Promise<BigNumber> => {
  const tokenContract = getContract('token')

  return tokenContract.allowance(account, CONTRACTS.lp.address)
}

export default fetchAllowance
