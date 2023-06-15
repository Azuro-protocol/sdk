export default [
  {
    "inputs": [],
    "name": "ActionNotAllowed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyPaid",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BetNotExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CantChangeFlag",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ConditionAlreadyCreated",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ConditionAlreadyResolved",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ConditionNotExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ConditionNotFinished",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "GameAlreadyStarted",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectConditionId",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectMargin",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectTimestamp",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LargeFundsRatio",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoPendingReward",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OnlyLp",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "OnlyOracle",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "waitTime",
        "type": "uint64"
      }
    ],
    "name": "ResolveTooEarly",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "enum SafeCast.Type",
        "name": "to",
        "type": "uint8"
      }
    ],
    "name": "SafeCastError",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SameOutcomes",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SmallOdds",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "pendingRewardsCount",
        "type": "uint256"
      }
    ],
    "name": "StartOutOfRange",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WrongOutcome",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroOdds",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      }
    ],
    "name": "ConditionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "state",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "outcomeWin",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "int128",
        "name": "lpProfit",
        "type": "int128"
      }
    ],
    "name": "ConditionResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "flag",
        "type": "bool"
      }
    ],
    "name": "ConditionStopped",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "version",
        "type": "uint8"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "bettor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "affiliate",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "outcomeId",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "amount",
        "type": "uint128"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "odds",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint128[2]",
        "name": "funds",
        "type": "uint128[2]"
      }
    ],
    "name": "NewBet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64[2]",
        "name": "newOdds",
        "type": "uint64[2]"
      }
    ],
    "name": "OddsChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "azuroBet",
    "outputs": [
      {
        "internalType": "contract IAzuroBet",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "bets",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      },
      {
        "internalType": "uint128",
        "name": "amount",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "payout",
        "type": "uint128"
      },
      {
        "internalType": "uint64",
        "name": "outcome",
        "type": "uint64"
      },
      {
        "internalType": "bool",
        "name": "isPaid",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      },
      {
        "internalType": "uint128",
        "name": "amount",
        "type": "uint128"
      },
      {
        "internalType": "uint64",
        "name": "outcome",
        "type": "uint64"
      }
    ],
    "name": "calcOdds",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "odds",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      }
    ],
    "name": "cancelCondition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      },
      {
        "internalType": "uint64[2]",
        "name": "newOdds",
        "type": "uint64[2]"
      }
    ],
    "name": "changeOdds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "checkOwner",
    "outputs": [],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "conditions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "internalType": "uint128",
        "name": "reinforcement",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "affiliatesReward",
        "type": "uint128"
      },
      {
        "internalType": "uint64",
        "name": "outcomeWin",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "margin",
        "type": "uint64"
      },
      {
        "internalType": "address",
        "name": "oracle",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "endsAt",
        "type": "uint64"
      },
      {
        "internalType": "enum ICondition.ConditionState",
        "name": "state",
        "type": "uint8"
      },
      {
        "internalType": "uint48",
        "name": "leaf",
        "type": "uint48"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      },
      {
        "internalType": "uint64[2]",
        "name": "odds",
        "type": "uint64[2]"
      },
      {
        "internalType": "uint64[2]",
        "name": "outcomes",
        "type": "uint64[2]"
      },
      {
        "internalType": "uint128",
        "name": "reinforcement",
        "type": "uint128"
      },
      {
        "internalType": "uint64",
        "name": "margin",
        "type": "uint64"
      }
    ],
    "name": "createCondition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      }
    ],
    "name": "getCondition",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "gameId",
            "type": "uint256"
          },
          {
            "internalType": "uint128[2]",
            "name": "funds",
            "type": "uint128[2]"
          },
          {
            "internalType": "uint128[2]",
            "name": "virtualFunds",
            "type": "uint128[2]"
          },
          {
            "internalType": "uint128",
            "name": "reinforcement",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "affiliatesReward",
            "type": "uint128"
          },
          {
            "internalType": "uint64[2]",
            "name": "outcomes",
            "type": "uint64[2]"
          },
          {
            "internalType": "uint64",
            "name": "outcomeWin",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "margin",
            "type": "uint64"
          },
          {
            "internalType": "address",
            "name": "oracle",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "endsAt",
            "type": "uint64"
          },
          {
            "internalType": "enum ICondition.ConditionState",
            "name": "state",
            "type": "uint8"
          },
          {
            "internalType": "uint48",
            "name": "leaf",
            "type": "uint48"
          }
        ],
        "internalType": "struct ICondition.Condition",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "affiliate",
        "type": "address"
      }
    ],
    "name": "getContributedConditionsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "azuroBet_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "lp_",
        "type": "address"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      }
    ],
    "name": "isConditionCanceled",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lp",
    "outputs": [
      {
        "internalType": "contract ILP",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "bettor",
        "type": "address"
      },
      {
        "internalType": "uint128",
        "name": "amount",
        "type": "uint128"
      },
      {
        "components": [
          {
            "internalType": "address",
            "name": "affiliate",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "internalType": "struct IBet.BetData",
        "name": "betData",
        "type": "tuple"
      }
    ],
    "name": "putBet",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "affiliate",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "resolveAffiliateReward",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "outcomeWin",
        "type": "uint64"
      }
    ],
    "name": "resolveCondition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "resolvePayout",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint128",
        "name": "",
        "type": "uint128"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "flag",
        "type": "bool"
      }
    ],
    "name": "stopCondition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "viewPayout",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const
