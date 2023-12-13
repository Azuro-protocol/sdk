type Procedure = (...args: any[]) => void

export function debounce<F extends Procedure>(func: F, wait: number, immediate?: boolean): (this: ThisParameterType<F>, ...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined

  return function (this: ThisParameterType<F>, ...args: Parameters<F>): void {
    const context = this

    const later = function () {
      timeout = undefined

      if (!immediate) {
        func.apply(context, args)
      }
    }

    const callNow = immediate && timeout === undefined

    if (timeout !== undefined) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)

    if (callNow) {
      func.apply(context, args)
    }
  }
}
