import { createWatcher } from '../helpers'
import { type OddsChangedData } from '../contexts/conditionUpdates'


export const oddsWatcher = createWatcher<OddsChangedData>()
