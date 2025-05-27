import { useWaitForTransactionReceipt, useSendTransaction, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { type Address, type Hex, encodeFunctionData } from 'viem'
import { useState } from 'react'

import { useChain } from '../../contexts/chain'
import { useBetsCache } from '../useBetsCache'
import { type Bet } from '../../global'
import { useExtendedAccount, useAAWalletClient } from '../useAaConnector'
import { useBetTokenBalance } from '../useBetTokenBalance'
import { useNativeBalance } from '../useNativeBalance'


const legacyV2LpAbi = [
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'core', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'tokenId', 'type': 'uint256' },
    ],
    'name': 'withdrawPayout',
    'outputs': [
      {
        'internalType': 'uint128', 'name': 'amount', 'type': 'uint128',
      },
    ],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
] as const

const legacyV2FreebetAbi = [
  {
    'inputs': [
      { 'internalType': 'uint256', 'name': 'freeBetId', 'type': 'uint256' },
    ],
    'name': 'withdrawPayout',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
] as const

type SubmitProps = {
  bets: Array<Pick<Bet, 'tokenId' | 'coreAddress' | 'lpAddress' | 'freebetContractAddress' | 'freebetId'>>
}

type AaTxState = {
  isPending: boolean
  data: Hex | undefined
  error: any
}

export default [ { 'inputs': [], 'name': 'AlreadyResolved', 'type': 'error' }, { 'inputs': [], 'name': 'BetAlreadyClaimed', 'type': 'error' }, { 'inputs': [], 'name': 'BetExpired', 'type': 'error' }, { 'inputs': [], 'name': 'IncorrectChainId', 'type': 'error' }, { 'inputs': [], 'name': 'InsufficientContractBalance', 'type': 'error' }, { 'inputs': [], 'name': 'InvalidSignature', 'type': 'error' }, { 'inputs': [], 'name': 'OnlyBetOwner', 'type': 'error' }, { 'inputs': [], 'name': 'OnlyFreeBetOwner', 'type': 'error' }, { 'inputs': [], 'name': 'OnlyManager', 'type': 'error' }, { 'inputs': [], 'name': 'SmallMinOdds', 'type': 'error' }, { 'anonymous': false, 'inputs': [ { 'indexed': false, 'internalType': 'address', 'name': 'newAffiliate', 'type': 'address' } ], 'name': 'AffiliateChanged', 'type': 'event' }, { 'anonymous': false, 'inputs': [ { 'indexed': true, 'internalType': 'address', 'name': 'core', 'type': 'address' }, { 'indexed': true, 'internalType': 'address', 'name': 'bettor', 'type': 'address' }, { 'indexed': true, 'internalType': 'uint256', 'name': 'freeBetId', 'type': 'uint256' }, { 'indexed': false, 'internalType': 'uint256', 'name': 'amount', 'type': 'uint256' } ], 'name': 'BettorWin', 'type': 'event' }, { 'anonymous': false, 'inputs': [ { 'indexed': false, 'internalType': 'uint8', 'name': 'version', 'type': 'uint8' } ], 'name': 'Initialized', 'type': 'event' }, { 'anonymous': false, 'inputs': [ { 'indexed': true, 'internalType': 'address', 'name': 'newLp', 'type': 'address' } ], 'name': 'LpChanged', 'type': 'event' }, { 'anonymous': false, 'inputs': [ { 'indexed': false, 'internalType': 'address', 'name': 'newManager', 'type': 'address' } ], 'name': 'ManagerChanged', 'type': 'event' }, { 'anonymous': false, 'inputs': [ { 'indexed': true, 'internalType': 'uint256', 'name': 'freeBetId', 'type': 'uint256' }, { 'indexed': false, 'internalType': 'address', 'name': 'core', 'type': 'address' }, { 'indexed': true, 'internalType': 'address', 'name': 'bettor', 'type': 'address' }, { 'indexed': true, 'internalType': 'uint256', 'name': 'azuroBetId', 'type': 'uint256' }, { 'indexed': false, 'internalType': 'uint128', 'name': 'amount', 'type': 'uint128' }, { 'indexed': false, 'internalType': 'uint64', 'name': 'minOdds', 'type': 'uint64' }, { 'indexed': false, 'internalType': 'uint64', 'name': 'expiresAt', 'type': 'uint64' } ], 'name': 'NewBet', 'type': 'event' }, { 'anonymous': false, 'inputs': [ { 'indexed': true, 'internalType': 'address', 'name': 'previousOwner', 'type': 'address' }, { 'indexed': true, 'internalType': 'address', 'name': 'newOwner', 'type': 'address' } ], 'name': 'OwnershipTransferred', 'type': 'event' }, { 'anonymous': false, 'inputs': [ { 'indexed': false, 'internalType': 'uint256[]', 'name': 'azuroBetId', 'type': 'uint256[]' } ], 'name': 'PayoutsResolved', 'type': 'event' }, { 'inputs': [], 'name': 'affiliate', 'outputs': [ { 'internalType': 'address', 'name': '', 'type': 'address' } ], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [ { 'components': [ { 'internalType': 'uint256', 'name': 'chainId', 'type': 'uint256' }, { 'internalType': 'uint256', 'name': 'freeBetId', 'type': 'uint256' }, { 'internalType': 'address', 'name': 'owner', 'type': 'address' }, { 'internalType': 'uint128', 'name': 'amount', 'type': 'uint128' }, { 'internalType': 'uint64', 'name': 'minOdds', 'type': 'uint64' }, { 'internalType': 'uint64', 'name': 'expiresAt', 'type': 'uint64' } ], 'internalType': 'struct IFreeBet.FreeBetData', 'name': 'freeBetData', 'type': 'tuple' }, { 'internalType': 'bytes', 'name': 'signature', 'type': 'bytes' }, { 'internalType': 'address', 'name': 'core', 'type': 'address' }, { 'internalType': 'uint256', 'name': 'conditionId', 'type': 'uint256' }, { 'internalType': 'uint64', 'name': 'outcomeId', 'type': 'uint64' }, { 'internalType': 'uint64', 'name': 'deadline', 'type': 'uint64' }, { 'internalType': 'uint64', 'name': 'minOdds', 'type': 'uint64' } ], 'name': 'bet', 'outputs': [ { 'internalType': 'uint256', 'name': 'azuroBetId', 'type': 'uint256' } ], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [ { 'internalType': 'address', 'name': 'account', 'type': 'address' } ], 'name': 'checkOwner', 'outputs': [], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [ { 'internalType': 'uint256', 'name': '', 'type': 'uint256' } ], 'name': 'freeBets', 'outputs': [ { 'internalType': 'address', 'name': 'owner', 'type': 'address' }, { 'internalType': 'address', 'name': 'core', 'type': 'address' }, { 'internalType': 'uint256', 'name': 'azuroBetId', 'type': 'uint256' }, { 'internalType': 'uint128', 'name': 'amount', 'type': 'uint128' }, { 'internalType': 'uint128', 'name': 'payout', 'type': 'uint128' } ], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [ { 'internalType': 'address', 'name': 'lpAddress', 'type': 'address' }, { 'internalType': 'address', 'name': 'affiliate_', 'type': 'address' }, { 'internalType': 'address', 'name': 'manager_', 'type': 'address' } ], 'name': 'initialize', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [], 'name': 'lockedReserve', 'outputs': [ { 'internalType': 'uint256', 'name': '', 'type': 'uint256' } ], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [], 'name': 'lp', 'outputs': [ { 'internalType': 'contract ILP', 'name': '', 'type': 'address' } ], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [], 'name': 'manager', 'outputs': [ { 'internalType': 'address', 'name': '', 'type': 'address' } ], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [], 'name': 'owner', 'outputs': [ { 'internalType': 'address', 'name': '', 'type': 'address' } ], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [ { 'internalType': 'uint256[]', 'name': 'freeBetIds', 'type': 'uint256[]' } ], 'name': 'resolvePayout', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [ { 'internalType': 'address', 'name': 'affiliate_', 'type': 'address' } ], 'name': 'setAffiliate', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [ { 'internalType': 'address', 'name': 'lp_', 'type': 'address' } ], 'name': 'setLp', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [ { 'internalType': 'address', 'name': 'manager_', 'type': 'address' } ], 'name': 'setManager', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [], 'name': 'token', 'outputs': [ { 'internalType': 'address', 'name': '', 'type': 'address' } ], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [ { 'internalType': 'address', 'name': 'newOwner', 'type': 'address' } ], 'name': 'transferOwnership', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [ { 'internalType': 'uint256', 'name': 'amount', 'type': 'uint256' } ], 'name': 'withdrawReserve', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'stateMutability': 'payable', 'type': 'receive' } ] as const

export const useRedeemBet = () => {
  const { contracts, appChain } = useChain()
  const wagmiConfig = useConfig()
  const { updateBetCache } = useBetsCache()
  const { refetch: refetchBetTokenBalance } = useBetTokenBalance()
  const { refetch: refetchNativeBalance } = useNativeBalance()

  const redeemTx = useSendTransaction()
  const account = useExtendedAccount()
  const aaClient = useAAWalletClient()

  const [ aaTxState, setAaTxState ] = useState<AaTxState>({ isPending: false, data: undefined, error: null })

  const receipt = useWaitForTransactionReceipt({
    hash: aaTxState.data || redeemTx.data,
    query: {
      enabled: Boolean(aaTxState.data) || Boolean(redeemTx.data),
    },
  })

  const isAAWallet = Boolean(account.isAAWallet)

  const submit = async (props: SubmitProps) => {
    const { bets } = props

    redeemTx.reset()
    setAaTxState({
      isPending: isAAWallet,
      data: undefined,
      error: null,
    })

    let data: Hex
    let to: Address

    const { freebetContractAddress, freebetId, coreAddress, lpAddress } = bets[0]!

    const isSameLp = new Set(bets.map(({ lpAddress }) => lpAddress)).size === 1

    if (!isSameLp) {
      throw new Error('redeem can\'t be executed for multiple lp contracts')
    }

    const isBatch = bets.length > 1
    const isV2 = lpAddress.toLowerCase() !== contracts.lp.address.toLowerCase()

    if (isBatch && isV2) {
      throw new Error('v2 redeem can\'t be executed for multiple bets')
    }

    if (freebetContractAddress && freebetId) {
      to = freebetContractAddress
      data = encodeFunctionData({
        abi: legacyV2FreebetAbi,
        functionName: 'withdrawPayout',
        args: [ BigInt(freebetId) ],
      })
    }
    else if (isV2) {
      to = lpAddress
      data = encodeFunctionData({
        abi: legacyV2LpAbi,
        functionName: 'withdrawPayout',
        args: [
          coreAddress,
          BigInt(bets[0]!.tokenId),
        ],
      })
    }
    else {
      to = lpAddress
      data = encodeFunctionData({
        abi: contracts.lp.abi,
        functionName: 'withdrawPayouts',
        args: [
          coreAddress,
          bets.map(({ tokenId }) => BigInt(tokenId)),
        ],
      })
    }

    let hash: Hex

    if (isAAWallet) {
      try {
        hash = await aaClient!.sendTransaction({ to, data, chain: appChain })

        setAaTxState({
          data: hash,
          isPending: false,
          error: null,
        })
      }
      catch (error: any) {
        setAaTxState({
          data: undefined,
          isPending: false,
          error,
        })

        throw error
      }
    }
    else {
      hash = await redeemTx.sendTransactionAsync({ to, data })
    }

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
      chainId: appChain.id,
    })

    if (receipt?.status === 'reverted') {
      redeemTx.reset()
      setAaTxState({
        isPending: false,
        data: undefined,
        error: null,
      })
      throw new Error(`transaction ${receipt.transactionHash} was reverted`)
    }

    refetchBetTokenBalance()
    refetchNativeBalance()

    bets.forEach(({ tokenId }) => {
      updateBetCache(
        tokenId,
        {
          isRedeemed: true,
          isRedeemable: false,
        },
        isV2
      )
    })

    return receipt
  }

  return {
    isPending: redeemTx.isPending || aaTxState.isPending,
    isProcessing: receipt.isLoading,
    data: redeemTx.data || aaTxState.data,
    error: redeemTx.error || aaTxState.error,
    submit,
  }
}
