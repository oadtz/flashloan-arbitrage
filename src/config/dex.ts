type Router = {
  [key: string]: string;
};

export const routers: Router = {
  // Ethereum
  UniSwap: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  SushiSwap: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
  // Binance Smart Chain
  PancakeSwap: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  BiSwap: "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8",
  MDEX: "0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8",
  ApeSwap: "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7",
  UniSwapV2: "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F",
};

export function getRouterName(address: string) {
  for (const routerName in routers) {
    if (routers[routerName].toLowerCase() === address.toLowerCase()) {
      return routerName;
    }
  }
  return null;
}

export const abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountIn",
        type: "uint256",
      },
      {
        internalType: "address[]",
        name: "path",
        type: "address[]",
      },
    ],
    name: "getAmountsOut",
    outputs: [
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountIn",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountOutMin",
        type: "uint256",
      },
      {
        internalType: "address[]",
        name: "path",
        type: "address[]",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "swapExactTokensForTokens",
    outputs: [
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];
