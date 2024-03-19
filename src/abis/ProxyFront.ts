[
  {
    'inputs': [],
    'stateMutability': 'nonpayable',
    'type': 'constructor',
  },
  {
    'inputs': [],
    'name': 'IncorrectValue',
    'type': 'error',
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
    'inputs': [],
    'name': 'initialize',
    'outputs': [],
    'stateMutability': 'nonpayable',
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
]
