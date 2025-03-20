import { createWatcher } from '../helpers/createWatcher'
import { type ConditionUpdatedData } from '../contexts/conditionUpdates'


export const conditionWatcher = createWatcher<ConditionUpdatedData>()
