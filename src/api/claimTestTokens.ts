import { getContract } from '../contracts'


export const checkTestTokensClaimable = (account: string) => {
  const tokenContract = getContract('token')

  return tokenContract.availableToClaim(account)
}

const claimTestTokens = (account: string) => {
  const tokenContract = getContract('token', true)

  return tokenContract.claim(account)
}

export default claimTestTokens
