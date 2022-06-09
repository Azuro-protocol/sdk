import { getContract } from '../contracts'


const fetchBalance = (account: string) => {
  const usdtContract = getContract('usdt')

  return usdtContract.balanceOf(account)
}

export default fetchBalance
