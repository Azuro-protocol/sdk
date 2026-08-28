type ReadStates = (conditionIds: string[]) => Promise<unknown>

export type StateReadQueue = {
  /** Ask for `conditionIds` to be read. `read` is remembered, so the newest reader is the one used. */
  request: (conditionIds: string[], read: ReadStates) => void
  /** Drop everything queued - what owns the queue has gone away or is watching something else. */
  clear: () => void
}

/**
 * How long ids are collected before a read goes out. Matches the window the request itself is
 * batched over, so collecting them costs no extra round trip.
 * */
const COLLECT_DELAY = 50

/**
 * Queue reads of per-outcome state from the feed, so that ids asked for at the same moment are read
 * together and a read asked for while one is in flight is not lost.
 *
 * Every condition of a game leaves `Active` at once when the game ends, and each one asking for its
 * own read would fold each answer into the caller's state separately - a copy of the whole state per
 * condition, on a page that watches every condition a game has. Ids asked for within the collection
 * window go out as one read and come back as one answer.
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
export const createStateReadQueue = (collectDelay: number = COLLECT_DELAY): StateReadQueue => {
  let pendingIds = new Set<string>()
  let pendingRead: ReadStates | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let isReading = false

  const flush = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }

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

        // whatever was asked for during the read left its ids behind - read them now, without
        // collecting again: they have been waiting for this read to end
        if (pendingRead) {
          flush()
        }
      })
  }

  const request = (conditionIds: string[], read: ReadStates) => {
    conditionIds.forEach((conditionId) => {
      pendingIds.add(conditionId)
    })

    pendingRead = read

    if (timer === undefined) {
      timer = setTimeout(flush, collectDelay)
    }
  }

  const clear = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }

    pendingIds = new Set()
    pendingRead = undefined
    isReading = false
  }

  return { request, clear }
}
