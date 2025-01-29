type Procedure = (...args: any[]) => void

export function debounce<F extends Procedure>(func: F, wait: number, withMaxRequests?: boolean): (this: ThisParameterType<F>, ...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined
  let requests = 0

  return function (this: ThisParameterType<F>, ...args: Parameters<F>): void {
    const context = this

    const later = function () {
      timeout = undefined
      requests = 0

      func.apply(context, args)
    }

    if (withMaxRequests) {
      requests++
    }

    if (requests > 10) {
      requests = 0
      func.apply(context, args)
    }

    if (timeout !== undefined) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)
  }
}
