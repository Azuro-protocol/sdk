import { createWatcher } from '../helpers'
import { type OddsChangedData } from '../contexts/oddsSocket'


export const oddsWatcher = createWatcher<OddsChangedData | undefined>()
