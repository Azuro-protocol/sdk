import { useContractWrite } from 'wagmi'
import { useContracts } from './useContracts'
import { useBetToken } from './useBetToken'


type SubmitProps = {
  tokenId: string
  coreAddress: `0x${string}`
}

export const useRedeemBet = () => {
  const contracts = useContracts()
  const betToken = useBetToken()

  const { isLoading, data, error, write } = useContractWrite({
    address: contracts?.lp.address,
    abi: contracts?.lp.abi,
    functionName: 'withdrawPayout',
  })

  const submit = async (props: SubmitProps) => {
    const { tokenId, coreAddress } = props

    write({
      args: [
        coreAddress,
        BigInt(tokenId),
        betToken!.isNative,
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
