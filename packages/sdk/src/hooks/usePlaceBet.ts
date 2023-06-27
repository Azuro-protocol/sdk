import { useContractWrite } from 'wagmi'
import { parseUnits, encodeAbiParameters, parseAbiParameters } from 'viem'
import { useContracts } from './useContracts'
import { useBetToken } from './useBetToken'
import { DEFAULT_DEADLINE, ODDS_DECIMALS } from '../config'


type SubmitProps = {
  amount: number
  minOdds: number
  deadline?: number
  affiliate: `0x${string}`
  selections: {
    conditionId: string | number
    outcomeId: string | number
  }[]
}

export const usePlaceBet = () => {
  const contracts = useContracts()
  const betToken = useBetToken()

  const { isLoading, data, error, write } = useContractWrite({
    address: contracts?.lp.address,
    abi: contracts?.lp.abi,
    functionName: 'bet',
  })

  const submit = async (props: SubmitProps) => {
    if (!write) {
      return
    }

    const fixedAmount = +parseFloat(String(props.amount)).toFixed(betToken!.decimals)
    const rawAmount = parseUnits(`${fixedAmount}`, betToken!.decimals)

    const fixedMinOdds = +parseFloat(String(props.minOdds)).toFixed(ODDS_DECIMALS)
    const rawMinOdds = parseUnits(`${fixedMinOdds}`, ODDS_DECIMALS)

    const deadline = BigInt(Math.floor(Date.now() / 1000) + (props.deadline || DEFAULT_DEADLINE))
    const affiliate = props.affiliate

    let coreAddress
    let data

    if (props.selections.length > 1) {
      const tuple: [ bigint, bigint ][] = props.selections.map(({ conditionId, outcomeId }) => [
        BigInt(conditionId),
        BigInt(outcomeId),
      ])

      data = encodeAbiParameters(
        parseAbiParameters('(uint256, uint64)[], uint64'),
        [
          tuple,
          rawMinOdds,
        ]
      )

      coreAddress = contracts!.prematchComboCore.address
    }
    else {
      const { conditionId, outcomeId } = props.selections[0]!

      data = encodeAbiParameters(
        parseAbiParameters('uint256, uint64, uint64'),
        [
          BigInt(conditionId),
          BigInt(outcomeId),
          rawMinOdds,
        ]
      )

      coreAddress = contracts!.prematchCore.address
    }

    write({
      args: [
        coreAddress,
        rawAmount,
        deadline,
        { affiliate, data }
      ],
    })
  }

  return {
    isDisabled: !contracts || !write,
    isLoading,
    data,
    error,
    submit,
  }
}
