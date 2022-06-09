import { getContract } from '../contracts'


export const checkTestTokensClaimable = (account: string) => {
  const usdtContract = getContract('usdt')

  return usdtContract.availableToClaim(account)
}

const claimTestTokens = (account: string) => {
  const usdtContract = getContract('usdt', true)

  return usdtContract.claim(account)
}

export default claimTestTokens
