import { state } from './index'


const getRateDecimals = async (): Promise<number> => {
  if (state.rateDecimals === null) {
    // TODO hardcoded for now - added on 27/06/2022 by mabalashov
    state.rateDecimals = 9
  }

  return state.rateDecimals
}

export default getRateDecimals
