import { getAssetName } from "../config/assets";
import { getRouterName } from "../config/dex";
import { estimateSwap, getProvider } from "./provider";
import { ethers } from "ethers";

export async function checkArbitrage(
  router1: string,
  router2: string,
  asset1: string,
  asset2: string,
  amountIn: bigint,
  networkProviderUrl: string
) {
  const routers = [router1, router2];
  const tokens = [asset1, asset2];

  console.log(
    "👁️ Checking scenario with routers: " +
      routers.map((router) => getRouterName(router)).join(" <-> ") +
      " and tokens: " +
      tokens.map((token) => getAssetName(token)).join("/")
  );

  const opportunity = await checkArbitrageScenario(
    routers,
    tokens,
    amountIn,
    networkProviderUrl
  );

  if (opportunity.profit > 0) {
    return opportunity;
  }

  return {
    profit: BigInt(0),
  };
}

async function checkArbitrageScenario(
  routers: string[],
  assets: string[],
  amountIn: bigint,
  networkProviderUrl: string
) {
  const provider = getProvider(networkProviderUrl);

  // Get asset1 out amount from router1
  const { amountOut: amountOut1, gas: gas1 } = await estimateSwap(
    routers[0],
    assets[0],
    assets[1],
    amountIn,
    provider
  );

  // Get asset2 out amount from router2
  const { amountOut: amountOut2, gas: gas2 } = await estimateSwap(
    routers[1],
    assets[1],
    assets[0],
    amountOut1,
    provider
  );

  const profit = amountOut2 - amountIn - gas1 - gas2;

  console.log(
    `Arbitrage opportunity: ${ethers.formatEther(profit)} ${getAssetName(
      assets[0]
    )}`
  );

  if (profit > 0) {
    return {
      profit,
      fromRouter: routers[0],
      toRouter: routers[1],
      tokenIn: assets[0],
      tokenOut: assets[1],
      amountIn: amountIn,
      amountOut: amountOut1,
    };
  }

  return {
    profit: BigInt(0),
  };
}
