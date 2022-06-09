const calculateOdd = (kef: number, marginality: number): number => {
  const obr_kef = 1 / (1 - 1 / kef)
  const margin_eur = 1 + marginality
  const a = margin_eur * (obr_kef - 1) / (kef - 1)
  const b = ((obr_kef - 1) / (kef - 1) + 1) * (margin_eur - 1)
  const c = 2 - margin_eur

  return (-1 * b + (b ** 2 + 4 * a * c) ** (1/2)) / (2 * a) + 1
}

// calculate odds based on fetched conditions data. Note that "fundBank" values change over time.
// to calculate actual odds use "calculateActualOdds" method
const calculateInitialOdds = (funds: number[], marginality: number): [ number, number ] => [
  calculateOdd(funds[0], marginality),
  calculateOdd(funds[1], marginality),
]

export default calculateInitialOdds
