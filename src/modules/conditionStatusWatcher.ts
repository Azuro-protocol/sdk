import { type ConditionState } from '@azuro-org/toolkit'

import { createWatcher } from '../helpers/createWatcher'


export const conditionStatusWatcher = createWatcher<ConditionState>()
