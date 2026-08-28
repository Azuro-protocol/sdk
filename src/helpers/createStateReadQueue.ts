type ReadStates = (conditionIds: string[]) => Promise<unknown>

export type StateReadQueue = {
  /** Ask for `conditionIds` to be read. `read` is remembered, so the newest reader is the one used. */
  request: (conditionIds: string[], read: ReadStates) => void
  /** Drop everything queued - what owns the queue has gone away or is watching something else. */
  clear: () => void
}

/**
 * Queue reads of per-outcome state from the feed, so that a read asked for while one is in flight is
 * not lost.
 *
 * A read answers for the feed as it was when the read was issued, so one already in flight cannot
 * answer a request made after it started: what prompted the request may have reached the feed after
 * the read left. Dropping the request would leave that news unread, and nothing guarantees anything
 * else will ask - the feed reports a condition settled and then goes quiet, and it can also
 * un-settle one, so no message is ever the last. The ids are therefore remembered and read again as
 * soon as the read in flight settles.
 *
 * A rejected read only ends the chain; recovering from it is the caller's business.
 * */
export const createStateReadQueue = (): StateReadQueue => {
  let pendingIds = new Set<string>()
  let pendingRead: ReadStates | undefined
  let isReading = false

  const flush = () => {
    if (isReading || !pendingRead) {
      return
    }

    const conditionIds = [ ...pendingIds ]
    const read = pendingRead

    pendingIds = new Set()
    pendingRead = undefined
    isReading = true

    read(conditionIds)
      .catch(() => {
        // the caller decides what a failed read means for it; the queue only stops chaining
      })
      .finally(() => {
        isReading = false

        // whatever was asked for during the read left the ids behind - read them now
        flush()
      })
  }

  const request = (conditionIds: string[], read: ReadStates) => {
    conditionIds.forEach((conditionId) => {
      pendingIds.add(conditionId)
    })

    pendingRead = read

    flush()
  }

  const clear = () => {
    pendingIds = new Set()
    pendingRead = undefined
    isReading = false
  }

  return { request, clear }
}
