import type { BigNumber } from 'ethers'

import { CONTRACTS, getContract } from '../contracts'


const fetchAllowance = (account: string): Promise<BigNumber> => {
  const usdtContract = getContract('usdt')

  return usdtContract.allowance(account, CONTRACTS.usdt.address)
}

export default fetchAllowance
