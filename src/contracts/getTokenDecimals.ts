import { getContract, state } from './index'


const getTokenDecimals = async (): Promise<number> => {
  if (state.tokenDecimals === null) {
    const tokenContract = getContract('token')

    state.tokenDecimals = tokenContract.decimals()
  }

  return state.tokenDecimals
}

export default getTokenDecimals
