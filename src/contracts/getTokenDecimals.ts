import state from './state'
import { getContract } from './index'

const getTokenDecimals = async (): Promise<number> => {
  if (state.tokenDecimals === null) {
    const tokenContract = getContract('token')

    state.tokenDecimals = await tokenContract.decimals()
  }

  return state.tokenDecimals
}

export default getTokenDecimals