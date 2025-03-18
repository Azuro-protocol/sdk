import { type ConditionState } from '@azuro-org/toolkit'

import { createWatcher } from '../helpers'


export const conditionStatusWatcher = createWatcher<ConditionState>()
