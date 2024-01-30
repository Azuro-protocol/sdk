export default [
  {
    'inputs': [],
    'stateMutability': 'nonpayable',
    'type': 'constructor',
  },
  {
    'inputs': [],
    'name': 'AlreadyPaid',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'BetNotExists',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'ConditionAlreadyResolved',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'ConditionNotFinished',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'ConditionNotRunning',
    'type': 'error',
  },
  {
    'inputs': [
      {
        'internalType': 'uint64',
        'name': 'outcome',
        'type': 'uint64',
      },
    ],
    'name': 'DuplicateOutcomes',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'IncorrectAmount',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'IncorrectConditionIds',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'IncorrectCore',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'IncorrectOdds',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'IncorrectSettleDate',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'IncorrectWinningOutcomesCount',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'InvalidBettorSignature',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'InvalidChainId',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'InvalidNonce',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'InvalidOracleSignature',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'OnlyLp',
    'type': 'error',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address',
      },
    ],
    'name': 'OnlyOracle',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'PayoutLimit',
    'type': 'error',
  },
  {
    'inputs': [
      {
        'internalType': 'enum SafeCast.Type',
        'name': 'to',
        'type': 'uint8',
      },
    ],
    'name': 'SafeCastError',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'SignatureExpired',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'SmallOdds',
    'type': 'error',
  },
  {
    'inputs': [],
    'name': 'WrongOutcome',
    'type': 'error',
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'uint256',
        'name': 'gameId',
        'type': 'uint256',
      },
      {
        'indexed': true,
        'internalType': 'uint256',
        'name': 'conditionId',
        'type': 'uint256',
      },
      {
        'indexed': false,
        'internalType': 'uint64[]',
        'name': 'outcomes',
        'type': 'uint64[]',
      },
      {
        'indexed': false,
        'internalType': 'uint256[]',
        'name': 'odds',
        'type': 'uint256[]',
      },
      {
        'indexed': false,
        'internalType': 'uint8',
        'name': 'winningOutcomesCount',
        'type': 'uint8',
      },
    ],
    'name': 'ConditionCreated',
    'type': 'event',
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'uint256',
        'name': 'conditionId',
        'type': 'uint256',
      },
      {
        'indexed': false,
        'internalType': 'uint8',
        'name': 'state',
        'type': 'uint8',
      },
      {
        'indexed': false,
        'internalType': 'uint64[]',
        'name': 'winningOutcomes',
        'type': 'uint64[]',
      },
      {
        'indexed': false,
        'internalType': 'int128',
        'name': 'lpProfit',
        'type': 'int128',
      },
      {
        'indexed': false,
        'internalType': 'uint64',
        'name': 'settledAt',
        'type': 'uint64',
      },
    ],
    'name': 'ConditionResolved',
    'type': 'event',
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': false,
        'internalType': 'uint8',
        'name': 'version',
        'type': 'uint8',
      },
    ],
    'name': 'Initialized',
    'type': 'event',
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'bettor',
        'type': 'address',
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'affiliate',
        'type': 'address',
      },
      {
        'indexed': true,
        'internalType': 'uint256',
        'name': 'conditionId',
        'type': 'uint256',
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'tokenId',
        'type': 'uint256',
      },
      {
        'indexed': false,
        'internalType': 'uint64',
        'name': 'outcomeId',
        'type': 'uint64',
      },
      {
        'indexed': false,
        'internalType': 'uint128',
        'name': 'amount',
        'type': 'uint128',
      },
      {
        'indexed': false,
        'internalType': 'uint64',
        'name': 'odds',
        'type': 'uint64',
      },
      {
        'indexed': false,
        'internalType': 'uint128',
        'name': 'payoutLimit',
        'type': 'uint128',
      },
    ],
    'name': 'NewLiveBet',
    'type': 'event',
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'previousOwner',
        'type': 'address',
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'newOwner',
        'type': 'address',
      },
    ],
    'name': 'OwnershipTransferred',
    'type': 'event',
  },
  {
    'inputs': [],
    'name': 'MAX_OUTCOMES_COUNT',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'azuroBet',
    'outputs': [
      {
        'internalType': 'contract IAzuroBet',
        'name': '',
        'type': 'address',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'name': 'bets',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': 'conditionId',
        'type': 'uint256',
      },
      {
        'internalType': 'uint128',
        'name': 'amount',
        'type': 'uint128',
      },
      {
        'internalType': 'uint128',
        'name': 'payout',
        'type': 'uint128',
      },
      {
        'internalType': 'uint64',
        'name': 'outcome',
        'type': 'uint64',
      },
      {
        'internalType': 'uint64',
        'name': 'timestamp',
        'type': 'uint64',
      },
      {
        'internalType': 'bool',
        'name': 'isPaid',
        'type': 'bool',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256[]',
        'name': 'conditionIds',
        'type': 'uint256[]',
      },
    ],
    'name': 'cancelConditions',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': 'account',
        'type': 'address',
      },
    ],
    'name': 'checkOwner',
    'outputs': [],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'name': 'conditions',
    'outputs': [
      {
        'internalType': 'int128',
        'name': 'maxReserved',
        'type': 'int128',
      },
      {
        'internalType': 'uint128',
        'name': 'totalNetBets',
        'type': 'uint128',
      },
      {
        'internalType': 'uint64',
        'name': 'settledAt',
        'type': 'uint64',
      },
      {
        'internalType': 'uint48',
        'name': 'lastDepositId',
        'type': 'uint48',
      },
      {
        'internalType': 'uint8',
        'name': 'winningOutcomesCount',
        'type': 'uint8',
      },
      {
        'internalType': 'enum IConditionState.ConditionState',
        'name': 'state',
        'type': 'uint8',
      },
      {
        'internalType': 'address',
        'name': 'oracle',
        'type': 'address',
      },
      {
        'internalType': 'bool',
        'name': 'isExpressForbidden',
        'type': 'bool',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': 'conditionId',
        'type': 'uint256',
      },
    ],
    'name': 'getCondition',
    'outputs': [
      {
        'components': [
          {
            'internalType': 'int128',
            'name': 'maxReserved',
            'type': 'int128',
          },
          {
            'internalType': 'uint128[]',
            'name': 'payouts',
            'type': 'uint128[]',
          },
          {
            'internalType': 'uint128',
            'name': 'totalNetBets',
            'type': 'uint128',
          },
          {
            'internalType': 'uint64',
            'name': 'settledAt',
            'type': 'uint64',
          },
          {
            'internalType': 'uint48',
            'name': 'lastDepositId',
            'type': 'uint48',
          },
          {
            'internalType': 'uint8',
            'name': 'winningOutcomesCount',
            'type': 'uint8',
          },
          {
            'internalType': 'enum IConditionState.ConditionState',
            'name': 'state',
            'type': 'uint8',
          },
          {
            'internalType': 'address',
            'name': 'oracle',
            'type': 'address',
          },
          {
            'internalType': 'bool',
            'name': 'isExpressForbidden',
            'type': 'bool',
          },
        ],
        'internalType': 'struct IClientCondition.Condition',
        'name': '',
        'type': 'tuple',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': 'conditionId',
        'type': 'uint256',
      },
      {
        'internalType': 'uint64',
        'name': 'outcome',
        'type': 'uint64',
      },
    ],
    'name': 'getOutcomeIndex',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': 'azuroBet_',
        'type': 'address',
      },
      {
        'internalType': 'address',
        'name': 'lp_',
        'type': 'address',
      },
    ],
    'name': 'initialize',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': 'conditionId',
        'type': 'uint256',
      },
    ],
    'name': 'isConditionCanceled',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': 'conditionId',
        'type': 'uint256',
      },
      {
        'internalType': 'uint64',
        'name': 'outcome',
        'type': 'uint64',
      },
    ],
    'name': 'isOutcomeWinning',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'lp',
    'outputs': [
      {
        'internalType': 'contract ILP',
        'name': '',
        'type': 'address',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address',
      },
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'name': 'nonces',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'name': 'outcomeNumbers',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'owner',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': 'bettor',
        'type': 'address',
      },
      {
        'internalType': 'uint128',
        'name': 'amount',
        'type': 'uint128',
      },
      {
        'components': [
          {
            'internalType': 'address',
            'name': 'affiliate',
            'type': 'address',
          },
          {
            'internalType': 'uint64',
            'name': 'minOdds',
            'type': 'uint64',
          },
          {
            'internalType': 'bytes',
            'name': 'data',
            'type': 'bytes',
          },
        ],
        'internalType': 'struct IBet.BetData',
        'name': 'betData',
        'type': 'tuple',
      },
    ],
    'name': 'putBet',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': 'tokenId',
        'type': 'uint256',
      },
    ],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'components': [
          {
            'internalType': 'uint256',
            'name': 'conditionId',
            'type': 'uint256',
          },
          {
            'internalType': 'uint64[]',
            'name': 'winningOutcomes',
            'type': 'uint64[]',
          },
          {
            'internalType': 'uint64',
            'name': 'settledAt',
            'type': 'uint64',
          },
        ],
        'internalType': 'struct IClientCoreBase.ResolveData[]',
        'name': 'data',
        'type': 'tuple[]',
      },
    ],
    'name': 'resolveConditions',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': 'tokenId',
        'type': 'uint256',
      },
    ],
    'name': 'resolvePayout',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address',
      },
      {
        'internalType': 'uint128',
        'name': '',
        'type': 'uint128',
      },
    ],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'name': 'snapshotTimes',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'name': 'snapshots',
    'outputs': [
      {
        'internalType': 'uint128',
        'name': 'totalNetBets',
        'type': 'uint128',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': 'newOwner',
        'type': 'address',
      },
    ],
    'name': 'transferOwnership',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': 'tokenId',
        'type': 'uint256',
      },
    ],
    'name': 'viewPayout',
    'outputs': [
      {
        'internalType': 'uint128',
        'name': '',
        'type': 'uint128',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256',
      },
    ],
    'name': 'winningOutcomes',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
] as const
