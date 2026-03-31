export { cookieKeys, localStorageKeys, LIVE_STATISTICS_SUPPORTED_SPORTS, LIVE_STATISTICS_SUPPORTED_PROVIDERS } from './config'
export * from './global'
export { AzuroSDKProvider } from './AzuroSDKProvider'

/**
 * Contexts
 * */
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

  type SoccerIncidentType,
  type SoccerIncidentGoal,
  type SoccerIncidenCorner,
  type SoccerIncidentCard,
  type SoccerIncidentSubstitution,
  type SoccerIncidentGoalKick,
  type SoccerIncidentThrowIn,
  type SoccerIncidentPenalty,
  type SoccerIncidentOffside,
  type SoccerIncidentScore,
  type SoccerIncidentExtraTimeStart,
  type SoccerIncidentPenaltiesStart,
  type SoccerIncidentPenaltyShootOut,
  type SoccerIncidentMissPenalty,
  type SoccerIncidens,

  type BasketballIncidentType,
  type BasketballIncidentMatchStart,
  type BasketballIncidentMatchEnd,
  type BasketballIncidentQuarterStart,
  type BasketballIncidentQuarterEnd,
  type BasketballIncidentPoint,
  type BasketballIncidentFreeThrow,
  type BasketballIncidentMissedThrow,
  type BasketballIncidentMissedFreeThrow,
  type BasketballIncidentPlayersOnCort,
  type BasketballIncidentPlayersWarmingUp,
  type BasketballIncidentFoul,
  type BasketballIncidentRebound,
  type BasketballIncidentTimeout,
  type BasketballIncidentTimeoutStart,
  type BasketballIncidentTimeoutEnd,
  type BasketballIncidentTurnover,
  type BasketballIncidentBlock,
  type BasketballIncidentSteal,
  type BasketballIncidentHalftime,
  type BasketballIncidentFulltime,
  type BasketballIncidentOvertime,
  type BasketballIncidentOvertimeStart,
  type BasketballIncidentOvertimeEnd,
  type BasketballIncidens,

  type TennisIncidentType,
  type TennisIncidentMatchStart,
  type TennisIncidentMatchEnd,
  type TennisIncidentSetStart,
  type TennisIncidentSetEnd,
  type TennisIncidentPlayersOnCort,
  type TennisIncidentPlayersWarmingUp,
  type TennisIncidentFirstServer,
  type TennisIncidentService,
  type TennisIncidentPoint,
  type TennisIncidentGame,
  type TennisIncidentSet,
  type TennisIncidentFault,
  type TennisIncidents,

  type VolleyballIncidentType,
  type VolleyballIncidentMatchStart,
  type VolleyballIncidentMatchEnd,
  type VolleyballIncidentSetStart,
  type VolleyballIncidentSetEnd,
  type VolleyballIncidentFirstServer,
  type VolleyballIncidentRally,
  type VolleyballIncidentPointWon,
  type VolleyballIncidentServiceError,
  type VolleyballIncidentTimeout,
  type VolleyballIncidentAce,
  type VolleyballIncidentMatchDelay,
  type VolleyballIncidentPlayersOnCort,
  type VolleyballIncidentPlayersWarmingUp,
  type VolleyballIncidentService,
  type VolleyballIncidets,

  type TimeLine,
  type Clock,
} from './contexts/liveStatisticsSocket'

/**
 * Data hooks
 * */
// temp useBets from graph
export {
  useBets,
  type UseBetsProps,
  type UseBets,
} from './hooks/data/useBetsGraph'
// export {
//   useBets,
//   type UseBetsProps,
//   type UseBets,
// } from './hooks/data/useBets'
export {
  useLegacyBets,
  type UseLegacyBetsProps,
} from './hooks/data/useLegacyBets'
export {
  useConditions,
  type UseConditionsProps,
  type UseConditions,
  getUseConditionsQueryOptions,
  type GetUseConditionsQueryOptionsProps,
  type UseConditionsQueryFnData,
} from './hooks/data/useConditions'
export {
  useActiveConditions,
  type UseActiveConditionsProps,
  type UseActiveConditions,
} from './hooks/data/useActiveConditions'
export {
  useGame,
  type UseGameProps,
  type UseGame,
  getUseGameQueryOptions,
  type GetUseGameQueryOptionsProps,
  type UseGameQueryFnData,
} from './hooks/data/useGame'
export {
  useActiveMarkets,
  type UseActiveMarketsProps,
  type UseActiveMarkets,
} from './hooks/data/useActiveMarkets'
export {
  useResolvedMarkets,
  type UseResolvedMarketsProps,
  type UseResolvedMarkets,
} from './hooks/data/useResolvedMarkets'
export {
  useGames,
  type UseGamesProps,
  getUseGamesQueryOptions,
  type GetUseGamesQueryOptionsProps,
  type UseGamesQueryFnData,
} from './hooks/data/useGames'
export {
  useSearchGames,
  type UseSearchGamesProps,
  getUseSearchGamesQueryOptions,
  type GetUseSearchGamesQueryOptionsProps,
  type UseSearchGamesQueryFnData,
} from './hooks/data/useSearchGames'
export {
  useSports,
  type UseSportsProps,
  type UseSports,
  getUseSportsQueryOptions,
  type GetUseSportsQueryOptionsProps,
  type UseSportsQueryFnData,
} from './hooks/data/useSports'
export {
  useSportsNavigation,
  type UseSportsNavigationProps,
  type UseSportsNavigation,
  getUseSportsNavigationQueryOptions,
  type GetUseSportsNavigationQueryOptionsProps,
  type UseSportsNavigationQueryFnData,
} from './hooks/data/useSportsNavigation'
export {
  useNavigation,
  type UseNavigationProps,
  type UseNavigation,
  getUseNavigationQueryOptions,
  type GetUseNavigationQueryOptionsProps,
  type UseNavigationQueryFnData,
} from './hooks/data/useNavigation'
export {
  useBetFee,
  type UseBetFeeProps,
  type UseBetFee,
  getUseBetFeeQueryOptions,
  type GetUseBetFeeQueryOptionsProps,
  type UseBetFeeQueryFnData,
} from './hooks/data/useBetFee'
export {
  useBetsSummary,
  type UseBetsSummaryProps,
  type UseBetsSummary,
} from './hooks/data/useBetsSummary'
export {
  useBetsSummaryBySelection,
  type UseBetsSummaryBySelectionProps,
  type UseBetsSummaryBySelection,
} from './hooks/data/useBetsSummaryBySelection'
export {
  useBetCalculation,
  type UseBetCalculationProps,
  getUseBetCalculationQueryOptions,
  type GetUseBetCalculationQueryOptionsProps,
  type UseBetCalculationQueryFnData,
} from './hooks/data/useBetCalculation'

/**
 * Write hooks
 * */
export { useRedeemBet } from './hooks/write/useRedeemBet'
export { useBet, BetOrderError, type UseBetProps } from './hooks/write/useBet'

/**
 * Watch hooks
 * */
export { useOdds, type UseOddsProps } from './hooks/watch/useOdds'
export { useSelectionOdds, type UseSelectionOddsProps } from './hooks/watch/useSelectionOdds'
export { useConditionState, type UseConditionStateProps } from './hooks/watch/useConditionState'
export { useConditionsState, type UseConditionsStateProps } from './hooks/watch/useConditionsState'
export { useGameState, type UseGameStateProps } from './hooks/watch/useGameState'
export { useLiveStatistics, type UseLiveStatisticsProps } from './hooks/watch/useLiveStatistics'
export { useActiveMarket, type UseActiveMarketProps } from './hooks/watch/useActiveMarket'

/**
 * Other hooks
 * */
export {
  useBetTokenBalance,
  type UseBetTokenBalanceProps,
  type UseBetTokenBalance,
} from './hooks/useBetTokenBalance'
export {
  useNativeBalance,
  type UseNativeBalanceProps,
  type UseNativeBalance,
} from './hooks/useNativeBalance'
export { useWrapTokens, WRAP_CHAINS } from './hooks/useWrapTokens'

/**
 * Cashout hooks
 * */
export {
  usePrecalculatedCashouts,
  type UsePrecalculatedCashoutsProps,
  type UsePrecalculatedCashouts,
} from './hooks/cashout/usePrecalculatedCashouts'
export {
  useCashout,
  type UseCashoutProps,
  type UseCashout,
} from './hooks/cashout/useCashout'

/**
 * Bonuses (freebets) hooks
 * */
export {
  useBonuses,
  type UseBonusesProps,
  type UseBonuses,
  getUseBonusesQueryOptions,
  type GetUseBonusesQueryOptionsProps,
  type UseBonusesQueryFnData,
} from './hooks/bonus/useBonuses'
export {
  useAvailableFreebets,
  type UseAvailableFreebetsProps,
  type UseAvailableFreebets,
  getUseAvailableFreebetsQueryOptions,
  type GetUseAvailableFreebetsQueryOptionsProps,
  type UseAvailableFreebetsQueryFnData,
} from './hooks/bonus/useAvailableFreebets'

/**
 * Wave hooks
 * */
export { useWaveLevels } from './hooks/wave/useWaveLevels'
export { useWaveStats } from './hooks/wave/useWaveStats'
export { useWavePeriods, type WavePeriod } from './hooks/wave/useWavePeriods'
export { useWaveLeaderBoard } from './hooks/wave/useWaveLeaderBoard'
export { useWaveActivation } from './hooks/wave/useWaveActivation'
