export default [
  {
    'inputs': [],
    'name': 'IncorrectValue',
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
    'inputs': [
      {
        'internalType': 'address',
        'name': 'lp',
        'type': 'address',
      },
      {
        'internalType': 'bytes',
        'name': 'data',
        'type': 'bytes',
      },
    ],
    'name': 'addLiquidityNative',
    'outputs': [],
    'stateMutability': 'payable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': 'lp',
        'type': 'address',
      },
      {
        'components': [
          {
            'internalType': 'address',
            'name': 'core',
            'type': 'address',
          },
          {
            'internalType': 'uint128',
            'name': 'amount',
            'type': 'uint128',
          },
          {
            'internalType': 'uint64',
            'name': 'expiresAt',
            'type': 'uint64',
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
            'name': 'extraData',
            'type': 'tuple',
          },
        ],
        'internalType': 'struct IProxyFront.BetData[]',
        'name': 'data',
        'type': 'tuple[]',
      },
    ],
    'name': 'bet',
    'outputs': [],
    'stateMutability': 'payable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': 'lp',
        'type': 'address',
      },
      {
        'internalType': 'uint48',
        'name': 'depositId',
        'type': 'uint48',
      },
      {
        'internalType': 'uint40',
        'name': 'percent',
        'type': 'uint40',
      },
    ],
    'name': 'withdrawLiquidityNative',
    'outputs': [],
    'stateMutability': 'payable',
    'type': 'function',
  },
  {
    'inputs': [
      {
        'components': [
          {
            'internalType': 'address',
            'name': 'core',
            'type': 'address',
          },
          {
            'internalType': 'uint256',
            'name': 'tokenId',
            'type': 'uint256',
          },
          {
            'internalType': 'bool',
            'name': 'isNative',
            'type': 'bool',
          },
        ],
        'internalType': 'struct IProxyFront.WithdrawPayoutData[]',
        'name': 'data',
        'type': 'tuple[]',
      },
    ],
    'name': 'withdrawPayouts',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'stateMutability': 'payable',
    'type': 'receive',
  },
] as const
