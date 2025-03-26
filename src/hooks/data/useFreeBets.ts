import { useQuery } from '@tanstack/react-query'
import { type ChainId, ODDS_DECIMALS, getFreeBets } from '@azuro-org/toolkit'
import { type Hex, formatUnits, type Address } from 'viem'
import { useCallback } from 'react'

import { useChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


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
  query?: QueryParameter<FreeBet[]>
}

export const useFreeBets = (props: Props) => {
  const { account, affiliate, enabled = true, query = {} } = props
  const { appChain, api } = useChain()

  const formatData = useCallback((data: FreeBet[]) => {
    return data.filter(({ chainId }) => +chainId === appChain.id)
  }, [ appChain.id ])

  return useQuery({
    queryKey: [ 'freebets', api, account?.toLowerCase(), affiliate?.toLowerCase() ],
    queryFn: async () => {
      const freebets = await getFreeBets({
        chainId: appChain.id,
        account,
        affiliate,
      })

      if (!freebets) {
        return []
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
    select: formatData,
    ...query,
  })
}
