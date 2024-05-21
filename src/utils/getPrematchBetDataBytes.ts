import { type Hex, encodeAbiParameters, parseAbiParameters } from 'viem'

import { type Selection } from '../global'


export const getPrematchBetDataBytes = (selections: Selection[]): Hex => {
  if (selections.length > 1) {
    const tuple: [ bigint, bigint ][] = selections.map(({ conditionId, outcomeId }) => [
      BigInt(conditionId),
      BigInt(outcomeId),
    ])

    return encodeAbiParameters(
      parseAbiParameters('(uint256, uint64)[]'),
      [
        tuple,
      ]
    )
  }

  const { conditionId, outcomeId } = selections[0]!

  return encodeAbiParameters(
    parseAbiParameters('uint256, uint64'),
    [
      BigInt(conditionId),
      BigInt(outcomeId),
    ]
  )
}
