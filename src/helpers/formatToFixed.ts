export const formatToFixed = (value: string | number, digitsCount: number): string => {
  value = String(value)

  if (!/\./.test(value)) {
    return value
  }

  const [ int, digits ] = value.split('.')

  if (digitsCount === 0 || !digits) {
    return int!
  }

  if (digits.length <= digitsCount) {
    return value
  }

  return `${int}.${digits!.substring(0, digitsCount)}`
}
