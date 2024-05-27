export const formatBetValue = (value: string) => {
  let newValue = value
  const [ int, digits ] = newValue.split('.')

  if (digits) {
    newValue = `${int}.${digits.substring(0, 2)}`
  }

  return newValue
}
