export { cookieKeys, localStorageKeys, LIVE_STATISTICS_SUPPORTED_SPORTS, LIVE_STATISTICS_SUPPORTED_PROVIDERS } from './config'
export * from './global'
export { AzuroSDKProvider } from './AzuroSDKProvider'

// contexts
export * from './contexts/chain'
export * from './contexts/live'
export * from './contexts/betslip'
export { FeedSocketProvider } from './contexts/feedSocket'
export { ConditionUpdatesProvider } from './contexts/conditionUpdates'
export { GameUpdatesProvider } from './contexts/gameUpdates'
export {
  LiveStatisticsSocketProvider,

  type HomeGuest,

  type SoccerScoreBoard,
  type BasketballScoreBoard,
  type TennisScoreBoard,
  type VolleyballScoreBoard,
  type ScoreBoard,

  type SoccerStats,
  type BasketballStats,
  type TennisStats,
  type VolleyballStats,
  type Stats,

  type LiveStatistics,
  type SoccerStatistic,
  type BasketballStatistic,
  type TennisStatistic,
  type VolleyballStatistic,
} from './contexts/liveStatisticsSocket'

// data hooks
export { useBets, type UseBetsProps } from './hooks/data/useBets'
export { useLegacyBets, type UseLegacyBetsProps } from './hooks/data/useLegacyBets'
export { useConditions } from './hooks/data/useConditions'
export { useActiveConditions } from './hooks/data/useActiveConditions'
export { useGame } from './hooks/data/useGame'
export { useActiveMarkets } from './hooks/data/useActiveMarkets'
export { useResolvedMarkets } from './hooks/data/useResolvedMarkets'
export { useGames, type UseGamesProps } from './hooks/data/useGames'
export { useSports, type UseSportsProps } from './hooks/data/useSports'
export { useSportsNavigation } from './hooks/data/useSportsNavigation'
export { useNavigation } from './hooks/data/useNavigation'
export { useBetFee } from './hooks/data/useBetFee'
export { useBetsSummary } from './hooks/data/useBetsSummary'
export { useBetsSummaryBySelection, type BetsSummaryBySelection } from './hooks/data/useBetsSummaryBySelection'
// export { useFreeBets, type FreeBet } from './hooks/data/useFreeBets' // TODO
export { useMaxBet } from './hooks/data/useMaxBet'

// write hooks
export { useRedeemBet } from './hooks/write/useRedeemBet'
export { usePrepareBet } from './hooks/write/usePrepareBet'

// watch hooks
export { useOdds } from './hooks/watch/useOdds'
export { useSelectionOdds } from './hooks/watch/useSelectionOdds'
export { useConditionState } from './hooks/watch/useConditionState'
export { useConditionsState } from './hooks/watch/useConditionsState'
export { useGameState } from './hooks/watch/useGameState'
export { useLiveStatistics } from './hooks/watch/useLiveStatistics'
export { useActiveMarket } from './hooks/watch/useActiveMarket'

// other hooks
export { useBetTokenBalance } from './hooks/useBetTokenBalance'
export { useNativeBalance } from './hooks/useNativeBalance'
export { useWrapTokens, WRAP_CHAINS } from './hooks/useWrapTokens'

// cashout
export { usePrecalculatedCashouts } from './hooks/cashout/usePrecalculatedCashouts'
export { useCashout } from './hooks/cashout/useCashout'

// wave
export { useWaveLevels } from './hooks/wave/useWaveLevels'
export { useWaveStats } from './hooks/wave/useWaveStats'
export { useWavePeriods, type WavePeriod } from './hooks/wave/useWavePeriods'
export { useWaveLeaderBoard } from './hooks/wave/useWaveLeaderBoard'
export { useWaveActivation } from './hooks/wave/useWaveActivation'
