type Router = {
  [key: string]: string;
};

export const routers: Router = {
  // Faked
  Faked: "0x731F759cc05df51104Ee87ff328A5d1549F256dA",
  // Localhost
  Local0: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  Local1: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  Local2: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  Local3: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  // Sepolia
  Router0: "0x7F377F5e261fc3ED8666612bf161d71C984b9F90",
  Router1: "0x24A99D2429c6cB7F9B0d7cd2023ff64226195d32",
  // Ethereum
  UniSwap: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  SushiSwap: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
  PanCakeSwapETH: "0xEfF92A263d31888d860bD50809A8D171709b7b1c",
  FraxSwap: "0xC14d550632db8592D1243Edc8B95b0Ad06703867",
  // Binance Smart Chain
  PancakeSwap: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  BiSwap: "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8",
  MDEX: "0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8",
  ApeSwap: "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7",
  UniSwapV2: "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F",
  // Polygon
  //UniSwapPolygon: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
  QuickSwap: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
  SushiSwapPolygon: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
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
