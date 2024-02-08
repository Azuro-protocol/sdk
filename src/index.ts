export { chainsData, type ChainId, cookieKeys, liveCoreAddress, liveHostAddress } from './config'
export { type Selection } from './global'
export { default as AzuroSDKProvider } from './AzuroSDKProvider'
// contexts
export * from './contexts/chain'
export * from './contexts/live'
export * from './contexts/apollo'
export { SocketProvider } from './contexts/socket'
export * from './contexts/betslip'
// docs
export { Game_OrderBy, Bet_OrderBy, ConditionStatus, OrderDirection, GameStatus as GraphGameStatus } from './docs/prematch/types'
export type { GamesDocument, GamesQuery, GamesQueryResult, GamesQueryVariables } from './docs/prematch/games'
export type { GameDocument, GameQuery, GameQueryResult, GameQueryVariables } from './docs/prematch/game'
export type { SportsDocument, SportsQuery, SportsQueryResult, SportsQueryVariables } from './docs/prematch/sports'
export type {
  BetsDocument as PrematchBetsDocument,
  BetsQuery as PrematchBetsQuery,
  BetsQueryResult as PrematchQueryResult,
  BetsQueryVariables as PrematchQueryVariables,
} from './docs/prematch/bets'
export type { LiveBetsDocument, LiveBetsQuery, LiveBetsQueryResult, LiveBetsQueryVariables } from './docs/prematch/liveBets'
export type { ConditionsDocument, ConditionsQuery, ConditionsQueryResult, ConditionsQueryVariables } from './docs/prematch/conditions'
export type { NavigationDocument, NavigationQuery, NavigationQueryResult, NavigationQueryVariables } from './docs/prematch/navigation'
// utils
export { calcMindOdds } from './utils/calcMindOdds'
export { calcLiveOdds, calcPrematchOdds } from './utils/calcOdds'
export { setGamesCacheTime } from './utils/setGamesCacheTime'
export { getGameStatus, GameStatus } from './utils/getGameStatus'
export { getBetStatus, BetStatus } from './utils/getBetStatus'
// hooks
export { usePrematchBets, type UsePrematchBetsProps, type PrematchBet as Bet, type PrematchBetOutcome as BetOutcome } from './hooks/usePrematchBets'
export { useLiveBets, type UseLiveBetsProps } from './hooks/useLiveBets'
export { useBetTokenBalance } from './hooks/useBetTokenBalance'
export { useOdds } from './hooks/useOdds'
export { useConditions } from './hooks/useConditions'
export { useGame } from './hooks/useGame'
export { useGameMarkets, type GameMarkets, type Market, type Condition, type MarketOutcome } from './hooks/useGameMarkets'
export { useGames, type UseGamesProps } from './hooks/useGames'
export { useSports, type UseSportsProps } from './hooks/useSports'
export { useGameStatus } from './hooks/useGameStatus'
export { useNativeBalance } from './hooks/useNativeBalance'
export { useSportsNavigation } from './hooks/useSportsNavigation'
export { useWatchers } from './hooks/useWatchers'
export { usePrepareBet } from './hooks/usePrepareBet'
export { useRedeemBet } from './hooks/useRedeemBet'
export { useSelection } from './hooks/useSelection'
export { useStatuses } from './hooks/useStatuses'
