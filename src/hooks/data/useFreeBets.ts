import { useQuery } from '@tanstack/react-query'
import { type ChainId, ODDS_DECIMALS, getFreeBets } from '@azuro-org/toolkit'
import { type Hex, formatUnits, type Address } from 'viem'
import { useMemo } from 'react'

import { useChain } from '../../contexts/chain'


export type FreeBet = {
  id: number
  contractAddress: Address
  signature: Hex
  expiresAt: number
  amount: string
  rawAmount: bigint
  minOdds: string
  rawMinOdds: bigint
  campaign: string
  chainId: ChainId
}

type Props = {
  account: Address
  affiliate: Address
  enabled?: boolean
}

export const useFreeBets = ({ account, affiliate, enabled }: Props) => {
  const { appChain, api } = useChain()

  const { data, ...rest } = useQuery({
    queryKey: [ 'freebets', api, account?.toLowerCase(), affiliate?.toLowerCase() ],
    queryFn: async () => {
      const freebets = await getFreeBets({
        chainId: appChain.id,
        account,
        affiliate,
      })

      if (!freebets) {
        return freebets
      }

      return freebets.map<FreeBet>(freebet => ({
        id: +freebet.id,
        contractAddress: freebet.contract.freebetContractAddress,
        signature: freebet.signature,
        expiresAt: freebet.expiresAt * 1000,
        amount: formatUnits(BigInt(freebet.amount), freebet.contract.decimals),
        rawAmount: BigInt(freebet.amount),
        minOdds: formatUnits(BigInt(freebet.minOdds), ODDS_DECIMALS),
        rawMinOdds: BigInt(freebet.minOdds),
        campaign: freebet.campaign,
        chainId: +freebet.contract.chainId as ChainId,
      }))
    },
    refetchOnWindowFocus: false,
    enabled,
  })

  const appChainFreeBets = useMemo(() => {
    if (!data) {
      return data
    }

    return data.filter(({ chainId }) => +chainId === appChain.id)
  }, [ data, appChain.id ])

  return {
    data: appChainFreeBets,
    ...rest,
  }
}
