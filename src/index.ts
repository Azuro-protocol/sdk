export { chainsData } from 'config'
export { ChainProvider, useChain } from 'chain-context'
// docs
export { Game_OrderBy, Bet_OrderBy } from './types'
export type { GamesDocument, GamesQuery, GamesQueryResult, GamesQueryVariables } from './docs/games'
export type { GameDocument, GameQuery, GameQueryResult, GameQueryVariables } from './docs/game'
export type { BetsDocument, BetsQuery, BetsQueryResult, BetsQueryVariables } from './docs/bets'
// utils
export { calcMindOdds } from './utils/calcMindOdds'
// hooks
export { useBets } from './hooks/useBets'
export { useCalcOdds } from './hooks/useCalcOdds'
export { useConditions } from './hooks/useConditions'
export { useGame } from './hooks/useGame'
export { useGames } from './hooks/useGames'
export { useOddsWatcher } from './hooks/useOddsWatcher'
export { usePlaceBet } from './hooks/usePlaceBet'
export { useRedeemBet } from './hooks/useRedeemBet'
export { useWatchOddsChange } from './hooks/useWatchOddsChange'
