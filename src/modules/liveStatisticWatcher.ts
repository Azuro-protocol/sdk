import { createWatcher } from '../helpers/createWatcher'
import { type LiveStatistics } from '../contexts/liveStatisticsSocket'


export const liveStatisticWatcher = createWatcher<LiveStatistics>()
