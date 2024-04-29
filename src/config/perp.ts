export const addresses = {
  localhost: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  bsc: "0x1b6F2d3844C6ae7D56ceb3C3643b9060ba28FEb0",
};

export const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "tradeHash",
        type: "bytes32",
      },
      {
        components: [
          {
            internalType: "address",
            name: "pairBase",
            type: "address",
          },
          {
            internalType: "bool",
            name: "isLong",
            type: "bool",
          },
          {
            internalType: "address",
            name: "tokenIn",
            type: "address",
          },
          {
            internalType: "uint96",
            name: "amountIn",
            type: "uint96",
          },
          {
            internalType: "uint80",
            name: "qty",
            type: "uint80",
          },
          {
            internalType: "uint64",
            name: "price",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "stopLoss",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "takeProfit",
            type: "uint64",
          },
          {
            internalType: "uint24",
            name: "broker",
            type: "uint24",
          },
        ],
        indexed: false,
        internalType: "struct PerpetualPortal.OpenDataInput",
        name: "trade",
        type: "tuple",
      },
    ],
    name: "MarketPendingTrade",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "tradeHash",
        type: "bytes32",
      },
    ],
    name: "closeTrade",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "getPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "getPriceFromCacheOrOracle",
    outputs: [
      {
        internalType: "uint64",
        name: "price",
        type: "uint64",
      },
      {
        internalType: "uint40",
        name: "updatedAt",
        type: "uint40",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "pairBase",
            type: "address",
          },
          {
            internalType: "bool",
            name: "isLong",
            type: "bool",
          },
          {
            internalType: "address",
            name: "tokenIn",
            type: "address",
          },
          {
            internalType: "uint96",
            name: "amountIn",
            type: "uint96",
          },
          {
            internalType: "uint80",
            name: "qty",
            type: "uint80",
          },
          {
            internalType: "uint64",
            name: "price",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "stopLoss",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "takeProfit",
            type: "uint64",
          },
          {
            internalType: "uint24",
            name: "broker",
            type: "uint24",
          },
        ],
        internalType: "struct PerpetualPortal.OpenDataInput",
        name: "openData",
        type: "tuple",
      },
    ],
    name: "openMarketTradeBNB",
    outputs: [
      {
        internalType: "bytes32",
        name: "tradeHash",
        type: "bytes32",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
];
