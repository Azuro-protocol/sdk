import { type GameData } from '../contexts/gameUpdates'
import { createWatcher } from '../helpers/createWatcher'


export const gameWathcer = createWatcher<GameData>()
