import { createWatcher } from '../helpers/createWatcher'
import { type OutcomeUpdateData } from '../contexts/conditionUpdates'


export const outcomeWatcher = createWatcher<OutcomeUpdateData>()
