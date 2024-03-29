import { getAssetName } from "../config/assets";
import { getRouterName } from "../config/dex";
import { estimateSwap, getGasPrice, Provider } from "./provider";
import { ethers } from "ethers";

export async function checkArbitrage(
  router1: string,
  router2: string,
  asset1: string,
  asset2: string,
  amountIn: bigint,
  slippageTolerance: number,
  provider: Provider
) {
  const routers = [router1, router2];
  const tokens = [asset1, asset2];

  console.log(
    "✅ Checking scenario with routers: " +
      routers.map((router) => getRouterName(router)).join(" <-> ") +
      " and tokens: " +
      tokens.map((token) => getAssetName(token)).join("/")
  );

  const opportunity = await checkArbitrageScenario(
    routers,
    tokens,
    amountIn,
    slippageTolerance,
    provider
  );

  return opportunity;
}

async function checkArbitrageScenario(
  routers: string[],
  assets: string[],
  amountIn: bigint,
  slippageTolerance: number,
  provider: Provider
) {
  try {
    // Get asset1 out amount from router1
    const { amountOut: amountOut1, gas: gas1 } = await estimateSwap(
      routers[0],
      assets[0],
      assets[1],
      amountIn,
      provider
    );

    console.log(
      `Estimated ${getAssetName(assets[0])} to ${getAssetName(
        assets[1]
      )} on ${getRouterName(routers[0])}: ${ethers.formatEther(
        amountIn
      )} ${getAssetName(assets[0])} -> ${ethers.formatEther(
        amountOut1
      )} ${getAssetName(assets[1])} with gas: ${ethers.formatEther(
        gas1 * (await getGasPrice(provider))
      )}`
    );

    // Get asset2 out amount from router2
    let { amountOut: amountOut2, gas: gas2 } = await estimateSwap(
      routers[1],
      assets[1],
      assets[0],
      amountOut1,
      provider
    );
    // let { amountOut: amountOut2, gas: gas2 } = await estimateSwap(
    //   routers[1],
    //   assets[0],
    //   assets[1],
    //   amountIn,
    //   provider
    // );
    // amountOut2 =
    //   (((amountOut1 * amountIn) / amountOut2) *
    //     BigInt(Math.floor(0.95 * 100))) /
    //   BigInt(100);

    console.log(
      `Estimated ${getAssetName(assets[1])} to ${getAssetName(
        assets[0]
      )} on ${getRouterName(routers[1])}: ${ethers.formatEther(
        amountOut2
      )} ${getAssetName(assets[0])} <- ${ethers.formatEther(
        amountOut1
      )} ${getAssetName(assets[1])} with gas: ${ethers.formatEther(
        gas1 * (await getGasPrice(provider))
      )}`
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
      fromRouter: routers[0],
      toRouter: routers[1],
      tokenIn: assets[0],
      tokenOut: assets[1],
      amountIn: amountIn,
      amountOut: amountOut1,
    };
  } catch (error) {
    //console.error("checkArbitrageScenarioError:", error);

    return {
      profit: BigInt(0),
      fromRouter: routers[0],
      toRouter: routers[1],
      tokenIn: assets[0],
      tokenOut: assets[1],
      amountIn: amountIn,
      amountOut: undefined,
    };
  }
}
