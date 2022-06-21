import { getContract } from '../contracts'


const fetchBalance = (account: string) => {
  const tokenContract = getContract('token')

  return tokenContract.balanceOf(account)
}

export default fetchBalance
