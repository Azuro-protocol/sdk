export default [
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      }
    ],
    "name": "ConditionNotFinished",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      }
    ],
    "name": "ConditionNotRunning",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectMaxOdds",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LargeFundsRatio",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LargeOdds",
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
    "name": "SameGameIdsNotAllowed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SmallOdds",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TooFewSubbets",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "conditionId",
        "type": "uint256"
      }
    ],
    "name": "TooLargeReinforcement",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WrongOutcome",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WrongToken",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approved",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
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
        "indexed": false,
        "internalType": "uint256",
        "name": "newMaxOdds",
        "type": "uint256"
      }
    ],
    "name": "MaxOddsChanged",
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
        "internalType": "uint256",
        "name": "betId",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "address",
            "name": "affiliate",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "odds",
            "type": "uint64"
          },
          {
            "internalType": "uint128",
            "name": "amount",
            "type": "uint128"
          },
          {
            "internalType": "uint48",
            "name": "leaf",
            "type": "uint48"
          },
          {
            "internalType": "bool",
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "conditionId",
                "type": "uint256"
              },
              {
                "internalType": "uint64",
                "name": "outcomeId",
                "type": "uint64"
              }
            ],
            "internalType": "struct IBetExpress.SubBet[]",
            "name": "subBets",
            "type": "tuple[]"
          },
          {
            "internalType": "uint64[]",
            "name": "conditionOdds",
            "type": "uint64[]"
          }
        ],
        "indexed": false,
        "internalType": "struct IBetExpress.Bet",
        "name": "bet",
        "type": "tuple"
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
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "newReinforcement",
        "type": "uint128"
      }
    ],
    "name": "ReinforcementChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "affRewards",
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
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
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
    "inputs": [],
    "name": "baseURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "conditionId",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "outcomeId",
            "type": "uint64"
          }
        ],
        "internalType": "struct IBetExpress.SubBet[]",
        "name": "subBets",
        "type": "tuple[]"
      },
      {
        "internalType": "uint128",
        "name": "amount",
        "type": "uint128"
      }
    ],
    "name": "calcOdds",
    "outputs": [
      {
        "internalType": "uint64[]",
        "name": "conditionOdds",
        "type": "uint64[]"
      },
      {
        "internalType": "uint256",
        "name": "expressOdds",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
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
    "name": "calcPayout",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newMaxOdds",
        "type": "uint256"
      }
    ],
    "name": "changeMaxOdds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint128",
        "name": "newReinforcement",
        "type": "uint128"
      }
    ],
    "name": "changeReinforcement",
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
    "inputs": [],
    "name": "core",
    "outputs": [
      {
        "internalType": "contract ICoreBase",
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
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
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
        "internalType": "uint256",
        "name": "betId",
        "type": "uint256"
      }
    ],
    "name": "getBet",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "affiliate",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "odds",
            "type": "uint64"
          },
          {
            "internalType": "uint128",
            "name": "amount",
            "type": "uint128"
          },
          {
            "internalType": "uint48",
            "name": "leaf",
            "type": "uint48"
          },
          {
            "internalType": "bool",
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "conditionId",
                "type": "uint256"
              },
              {
                "internalType": "uint64",
                "name": "outcomeId",
                "type": "uint64"
              }
            ],
            "internalType": "struct IBetExpress.SubBet[]",
            "name": "subBets",
            "type": "tuple[]"
          },
          {
            "internalType": "uint64[]",
            "name": "conditionOdds",
            "type": "uint64[]"
          }
        ],
        "internalType": "struct IBetExpress.Bet",
        "name": "betInfo",
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
        "name": "lp_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "core_",
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
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
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
    "name": "lastBetId",
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
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "lockedReserves",
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
    "name": "maxOdds",
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
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
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
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
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
        "name": "betId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reinforcement",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "",
        "type": "uint128"
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
      },
      {
        "internalType": "bytes",
        "name": "",
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
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "resolvePayout",
    "outputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "uint128",
        "name": "payout",
        "type": "uint128"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "uri",
        "type": "string"
      }
    ],
    "name": "setBaseURI",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
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
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
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
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
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
