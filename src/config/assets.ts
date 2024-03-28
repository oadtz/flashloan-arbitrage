type Asset = {
  [key: string]: string;
};

export const assets: Asset = {
  // Ethereum
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  // Binance Smart Chain
  USDT: "0x55d398326f99059fF775485246999027B3197955",
  WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  ETH: "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
  BUSD: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  BTCB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
};

export function getAssetName(address: string) {
  for (const assetName in assets) {
    if (assets[assetName].toLowerCase() === address.toLowerCase()) {
      return assetName;
    }
  }
  return null;
}

export const abi = [];
