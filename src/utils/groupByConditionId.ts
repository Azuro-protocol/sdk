type Condition = {
  conditionId: string
}

export const groupByConditionId = <T extends Condition>(data: T[]): Record<string, T[]> => {
  return data.reduce<Record<string, T[]>>((acc, item) => {
    const { conditionId } = item
    const key = String(conditionId)

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key]!.push(item)

    return acc
  }, {})
}
