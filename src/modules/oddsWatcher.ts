import { createWatcher } from '../helpers/createWatcher'
import { type OddsChangedData } from '../contexts/conditionUpdates'


export const oddsWatcher = createWatcher<OddsChangedData>()
