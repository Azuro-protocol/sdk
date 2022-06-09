import { getContract } from '../contracts'


const redeemBetPrize = (nftId: number) => {
  const lpContract = getContract('lp', true)

  return lpContract.withdrawPayout(nftId)
}

export default redeemBetPrize
