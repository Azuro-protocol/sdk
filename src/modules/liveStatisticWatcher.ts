import { createWatcher } from '../helpers'
import { type LiveStatisticsData } from '../contexts/liveStatisticsSocket'


export const liveStatisticWatcher = createWatcher<LiveStatisticsData>()
