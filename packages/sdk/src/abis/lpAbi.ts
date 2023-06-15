export default [
  {
    "inputs": [],
    "name": "BetExpired",
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
    "name": "ClaimTimeout",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CoreNotActive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "GameAlreadyCanceled",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "GameAlreadyCreated",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "GameCanceled_",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "GameNotExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectCoreState",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectFee",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectGameId",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectMinBet",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectMinDepo",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectPercent",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectReinforcementAbility",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectTimestamp",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LeafNotExist",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LiquidityIsLocked",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LiquidityNotOwned",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoLiquidity",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotEnoughLiquidity",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OnlyFactory",
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
    "name": "SmallBet",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SmallDepo",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnknownCore",
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
    "name": "WithdrawalTimeout",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "affiliate",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "AffiliateRewarded",
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
        "indexed": true,
        "internalType": "address",
        "name": "core",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "bettor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "BettorWin",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "newClaimTimeout",
        "type": "uint64"
      }
    ],
    "name": "ClaimTimeoutChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "core",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum ILP.CoreState",
        "name": "state",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "reinforcementAbility",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "minBet",
        "type": "uint128"
      }
    ],
    "name": "CoreSettingsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "newDataProvider",
        "type": "address"
      }
    ],
    "name": "DataProviderChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "enum ILP.FeeType",
        "name": "feeType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "fee",
        "type": "uint64"
      }
    ],
    "name": "FeeChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "GameCanceled",
    "type": "event"
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
        "indexed": false,
        "internalType": "uint64",
        "name": "newStart",
        "type": "uint64"
      }
    ],
    "name": "GameShifted",
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
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint48",
        "name": "leaf",
        "type": "uint48"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "LiquidityAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint48",
        "name": "leaf",
        "type": "uint48"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "LiquidityRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "core",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "newMinBet",
        "type": "uint128"
      }
    ],
    "name": "MinBetChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "newMinDepo",
        "type": "uint128"
      }
    ],
    "name": "MinDepoChanged",
    "type": "event"
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
        "indexed": false,
        "internalType": "bytes32",
        "name": "ipfsHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "startsAt",
        "type": "uint64"
      }
    ],
    "name": "NewGame",
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
        "name": "newReinforcementAbility",
        "type": "uint128"
      }
    ],
    "name": "ReinforcementAbilityChanged",
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
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "newWithdrawTimeout",
        "type": "uint64"
      }
    ],
    "name": "WithdrawTimeoutChanged",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "access",
    "outputs": [
      {
        "internalType": "contract IAccess",
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
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "addCondition",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "core",
        "type": "address"
      }
    ],
    "name": "addCore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint128",
        "name": "amount",
        "type": "uint128"
      }
    ],
    "name": "addLiquidity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "addLiquidityNative",
    "outputs": [],
    "stateMutability": "payable",
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
        "internalType": "uint128",
        "name": "lockedReserve",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "finalReserve",
        "type": "uint128"
      },
      {
        "internalType": "uint48",
        "name": "leaf",
        "type": "uint48"
      }
    ],
    "name": "addReserve",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "affiliatesReward",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "core",
        "type": "address"
      },
      {
        "internalType": "uint128",
        "name": "amount",
        "type": "uint128"
      },
      {
        "internalType": "uint64",
        "name": "expiresAt",
        "type": "uint64"
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
    "name": "bet",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
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
        "name": "bettor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "core",
        "type": "address"
      },
      {
        "internalType": "uint128",
        "name": "amount",
        "type": "uint128"
      },
      {
        "internalType": "uint64",
        "name": "expiresAt",
        "type": "uint64"
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
    "name": "betFor",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
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
        "name": "core",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "expiresAt",
        "type": "uint64"
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
    "name": "betNative",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "cancelGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "newClaimTimeout",
        "type": "uint64"
      }
    ],
    "name": "changeClaimTimeout",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newDataProvider",
        "type": "address"
      }
    ],
    "name": "changeDataProvider",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum ILP.FeeType",
        "name": "feeType",
        "type": "uint8"
      },
      {
        "internalType": "uint64",
        "name": "newFee",
        "type": "uint64"
      }
    ],
    "name": "changeFee",
    "outputs": [],
    "stateMutability": "nonpayable",
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
        "internalType": "int128",
        "name": "deltaReserve",
        "type": "int128"
      }
    ],
    "name": "changeLockedLiquidity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint128",
        "name": "newMinDepo",
        "type": "uint128"
      }
    ],
    "name": "changeMinDepo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "newWithdrawTimeout",
        "type": "uint64"
      }
    ],
    "name": "changeWithdrawTimeout",
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
      },
      {
        "internalType": "address",
        "name": "target",
        "type": "address"
      },
      {
        "internalType": "bytes4",
        "name": "selector",
        "type": "bytes4"
      }
    ],
    "name": "checkAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "core",
        "type": "address"
      }
    ],
    "name": "checkCore",
    "outputs": [],
    "stateMutability": "view",
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
        "internalType": "address",
        "name": "core",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "affiliate",
        "type": "address"
      }
    ],
    "name": "claimAffiliateRewardFor",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "claimedAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimReward",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "claimedAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimTimeout",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "coreAffRewards",
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
        "name": "",
        "type": "address"
      }
    ],
    "name": "cores",
    "outputs": [
      {
        "internalType": "enum ILP.CoreState",
        "name": "state",
        "type": "uint8"
      },
      {
        "internalType": "uint64",
        "name": "reinforcementAbility",
        "type": "uint64"
      },
      {
        "internalType": "uint128",
        "name": "minBet",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "lockedLiquidity",
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
        "name": "gameId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "ipfsHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint64",
        "name": "startsAt",
        "type": "uint64"
      }
    ],
    "name": "createGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "dataProvider",
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
    "inputs": [],
    "name": "factory",
    "outputs": [
      {
        "internalType": "contract IOwnable",
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
    "name": "fees",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
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
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "games",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "ipfsHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint128",
        "name": "lockedLiquidity",
        "type": "uint128"
      },
      {
        "internalType": "uint64",
        "name": "startsAt",
        "type": "uint64"
      },
      {
        "internalType": "bool",
        "name": "canceled",
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
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "getGameInfo",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      },
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
    "name": "getLeaf",
    "outputs": [
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
        "internalType": "address",
        "name": "core",
        "type": "address"
      }
    ],
    "name": "getLockedLiquidityLimit",
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
    "inputs": [],
    "name": "getReserve",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "reserve",
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
        "name": "access_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "dataProvider_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "token_",
        "type": "address"
      },
      {
        "internalType": "uint128",
        "name": "minDepo_",
        "type": "uint128"
      },
      {
        "internalType": "uint64",
        "name": "daoFee",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "dataProviderFee",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "affiliateFee",
        "type": "uint64"
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "isGameCanceled",
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
    "name": "lockedLiquidity",
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
    "inputs": [],
    "name": "minDepo",
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
    "name": "nextNode",
    "outputs": [
      {
        "internalType": "uint48",
        "name": "",
        "type": "uint48"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint48",
        "name": "leaf",
        "type": "uint48"
      }
    ],
    "name": "nodeWithdrawView",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "withdrawAmount",
        "type": "uint128"
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
        "name": "",
        "type": "address"
      }
    ],
    "name": "rewards",
    "outputs": [
      {
        "internalType": "int128",
        "name": "amount",
        "type": "int128"
      },
      {
        "internalType": "uint64",
        "name": "claimedAt",
        "type": "uint64"
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
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "startsAt",
        "type": "uint64"
      }
    ],
    "name": "shiftGame",
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
    "inputs": [],
    "name": "token",
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
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenByIndex",
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
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenOfOwnerByIndex",
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
    "inputs": [],
    "name": "totalSupply",
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
        "internalType": "uint48",
        "name": "",
        "type": "uint48"
      }
    ],
    "name": "treeNode",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "updateId",
        "type": "uint64"
      },
      {
        "internalType": "uint128",
        "name": "amount",
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
        "name": "core",
        "type": "address"
      },
      {
        "internalType": "enum ILP.CoreState",
        "name": "state",
        "type": "uint8"
      },
      {
        "internalType": "uint64",
        "name": "reinforcementAbility",
        "type": "uint64"
      },
      {
        "internalType": "uint128",
        "name": "minBet",
        "type": "uint128"
      }
    ],
    "name": "updateCoreSettings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "updateId",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "core",
        "type": "address"
      },
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
  },
  {
    "inputs": [
      {
        "internalType": "uint48",
        "name": "",
        "type": "uint48"
      }
    ],
    "name": "withdrawAfter",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint48",
        "name": "depNum",
        "type": "uint48"
      },
      {
        "internalType": "uint40",
        "name": "percent",
        "type": "uint40"
      },
      {
        "internalType": "bool",
        "name": "isNative",
        "type": "bool"
      }
    ],
    "name": "withdrawLiquidity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "core",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isNative",
        "type": "bool"
      }
    ],
    "name": "withdrawPayout",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawTimeout",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const
