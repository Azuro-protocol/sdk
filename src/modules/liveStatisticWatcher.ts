import { createWatcher } from '../helpers'
import { type LiveStatistics } from '../contexts/liveStatisticsSocket'


export const liveStatisticWatcher = createWatcher<LiveStatistics>()
