import { ethers } from "ethers";
import { Provider, getProvider, toDecimals } from "./provider";
import { abi as arbitrageAbi } from "../config/arbitrage";
import { getRouterName } from "../config/dex";
import { getAssetName } from "../config/assets";
import { shuffle } from "lodash";

export async function run(
  routersToCheck: any[],
  assetsToCheck: any[],
  slippageTolerance: number,
  flashLoanFee: number,
  networkProviderUrl: string,
  arbitrageContractAddress: string,
  delay: number
) {
  console.log("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  while (true) {
    const shuffledAssets = shuffle(assetsToCheck);
    const shuffledRouters = shuffle(routersToCheck);

    const {
      token: token0,
      amount: borrowedAmount,
      borrowable,
    } = shuffledAssets[Math.floor(Math.random() * shuffledAssets.length)];
    const { token: token1 } =
      shuffledAssets[Math.floor(Math.random() * shuffledAssets.length)];

    if (token0 === token1 || !borrowable) {
      continue;
    }

    const router0 =
      shuffledRouters[Math.floor(Math.random() * shuffledRouters.length)];
    const router1 =
      shuffledRouters[Math.floor(Math.random() * shuffledRouters.length)];

    if (router0 === router1) {
      continue;
    }

    const amountIn = await toDecimals(borrowedAmount, token0, provider);
    const expactedAmountOut =
      (amountIn * BigInt((1 + flashLoanFee) * 100_000)) / BigInt(100_000);

    console.log("Checking arbitrage...");

    const amountOut = await checkArbitrage(
      router0,
      router1,
      token0,
      token1,
      amountIn,
      expactedAmountOut,
      provider,
      arbitrageContractAddress
    );

    console.log(`Route0 (${getRouterName(router0)}):`, router0);
    console.log(`Route1 (${getRouterName(router1)}): `, router1);
    console.log(`Token0 (${getAssetName(token0)}): `, token0);
    console.log(`Token1 (${getAssetName(token1)}): `, token1);
    console.log("amountIn: ", amountIn.toString());
    console.log("amountOut: ", amountOut.toString());

    if (amountOut > expactedAmountOut) {
      console.log("✅ Arbitrage opportunity found!");

      const result = await executeArbitrage(
        router0,
        router1,
        token0,
        token1,
        amountIn,
        expactedAmountOut,
        provider,
        arbitrageContractAddress
      );

      if (result) {
        console.log("Withdrawing funds...");

        if (await withdraw(token0, provider, arbitrageContractAddress)) {
          console.log(`🎉🎉🎉🎉🎉🎉🎉🎉 Arbitrage opportunity done\n\n`);
        } else {
          console.log(`❌ Error withdrawing funds\n\n`);
        }
      } else {
        console.log(`❌ Not an arbitrage opportunity\n\n`);
      }
    } else {
      console.log(`❌ Not an arbitrage opportunity\n\n`);
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

async function checkArbitrage(
  router0: string,
  router1: string,
  token0: string,
  token1: string,
  amountIn: bigint,
  expactedAmountOut: bigint,
  provider: Provider,
  arbitrageContractAddress: string
): Promise<bigint> {
  try {
    if (arbitrageContractAddress) {
      const arbiter = new ethers.Contract(
        arbitrageContractAddress,
        arbitrageAbi,
        provider.ethers
      );

      const amountOut: bigint = await arbiter.checkArbitrage(
        router0,
        router1,
        token0,
        token1,
        amountIn,
        expactedAmountOut,
        {
          gasLimit: 3000000,
        }
      );

      return amountOut;
    }
  } catch (error) {
    console.error("Error checking arbitrage");
  }

  return BigInt(0);
}

async function executeArbitrage(
  router0: string,
  router1: string,
  token0: string,
  token1: string,
  amountIn: bigint,
  expactedAmountOut: bigint,
  provider: Provider,
  arbitrageContractAddress: string
): Promise<boolean> {
  if (!arbitrageContractAddress) return false; // Skip arbitrage if no contract address is provided

  try {
    const arbiter = new ethers.Contract(
      arbitrageContractAddress,
      arbitrageAbi,
      provider.wallet
    );

    const tx = await arbiter.executeArbitrage(
      router0,
      router1,
      token0,
      token1,
      amountIn,
      expactedAmountOut,
      {
        gasLimit: 3000000,
      }
    );

    await tx.wait();

    return true;
  } catch (error) {
    console.error("Error performing arbitrage", error);
    return false;
  }
}

async function withdraw(
  assetToWithdraw: string,
  provider: Provider,
  arbitrageContractAddress: string
) {
  if (!arbitrageContractAddress) return false; // Skip withdrawal if no contract address is provided

  try {
    const contract = new ethers.Contract(
      arbitrageContractAddress,
      arbitrageAbi,
      provider.wallet
    );

    const tx = await contract.withdraw(assetToWithdraw, {
      gasLimit: 3000000,
    });

    await tx.wait();

    return true;
  } catch (error) {
    console.error("Error withdrawing funds", error);
    return false;
  }
}
