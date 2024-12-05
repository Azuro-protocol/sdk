const CONDITION_PROVIDER_LENGTH = 3

export const getProviderFromConditionId = (conditionId: string) => {
  return +conditionId.slice(1, 1 + CONDITION_PROVIDER_LENGTH)
}
