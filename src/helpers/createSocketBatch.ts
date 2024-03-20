import type { SocketContextValue } from '../contexts/socket'
import createBatch from './createBatch'


export const createSocketBatch = (fn: SocketContextValue['subscribeToUpdates']) => createBatch<void, SocketContextValue['subscribeToUpdates']>(fn)
