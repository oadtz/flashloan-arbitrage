import { ethers } from "ethers";
import { Provider, formatDecimals, getProvider, toDecimals } from "./provider";
import { abi as arbitrageAbi } from "../config/arbitrage";
import { getRouterName } from "../config/dex";
import { Asset, getAssetName } from "../config/assets";
import { shuffle } from "lodash";
import logger from "./logger";

export async function run(
  routersToCheck: any[],
  assetsToCheck: {
    token: Asset;
    amount: number;
    borrowable?: boolean;
  }[],
  slippageTolerance: number,
  flashLoanFee: number,
  networkProviderUrl: string,
  arbitrageContractAddress: string,
  delay: number
) {
  logger.debug("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  const nonProfitableRoutesAndAssets = [];

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

    if (
      nonProfitableRoutesAndAssets.findIndex((nonProfitable) => {
        return (
          nonProfitable.router0 === router0 &&
          nonProfitable.router1 === router1 &&
          nonProfitable.token0 === token0.address &&
          nonProfitable.token1 === token1.address
        );
      }) !== -1
    )
      continue;

    const randomFactor = slippageTolerance + Math.random() * slippageTolerance; // Generate a random factor between 0.5 and 1
    const amountIn =
      randomFactor > 0
        ? (toDecimals(borrowedAmount, token0.decimals) *
            BigInt(Math.floor(randomFactor * 100))) /
          BigInt(100)
        : toDecimals(borrowedAmount, token0.decimals);
    const expactedAmountOut =
      (amountIn * BigInt((1 + flashLoanFee) * 100_000)) / BigInt(100_000);

    logger.debug("Checking arbitrage...");

    const amountOut = await checkArbitrage(
      router0,
      router1,
      token0.address,
      token1.address,
      amountIn,
      expactedAmountOut,
      provider,
      arbitrageContractAddress
    );

    logger.debug(`Route0 (${getRouterName(router0)}): ${router0}`);
    logger.debug(`Route1 (${getRouterName(router1)}): ${router1}`);
    logger.debug(`Token0 (${getAssetName(token0.address)}): ${token0.address}`);
    logger.debug(`Token1 (${getAssetName(token1.address)}): ${token1.address}`);
    logger.debug(`amountIn: ${formatDecimals(amountIn, token0.decimals)}`);
    logger.debug(`amountOut: ${formatDecimals(amountOut, token0.decimals)}`);

    if (amountOut > expactedAmountOut) {
      logger.debug("✅ Arbitrage opportunity found!");

      const result = await executeArbitrage(
        router0,
        router1,
        token0.address,
        token1.address,
        amountIn,
        expactedAmountOut,
        provider,
        arbitrageContractAddress
      );

      if (result) {
        logger.debug("Withdrawing funds...");

        if (
          await withdraw(token0.address, provider, arbitrageContractAddress)
        ) {
          logger.debug(`🎉🎉🎉🎉🎉🎉🎉🎉 Arbitrage opportunity done\n\n`);
        } else {
          logger.debug(`❌ Error withdrawing funds\n\n`);
          process.exit(1);
        }
      } else {
        logger.debug(`❌ Not an arbitrage opportunity\n\n`);
        process.exit(1);
      }
    } else {
      logger.debug(`❌ Not an arbitrage opportunity\n\n`);

      if (amountOut === BigInt(0)) {
        nonProfitableRoutesAndAssets.push({
          router0,
          router1,
          token0: token0.address,
          token1: token1.address,
        });
      }
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export async function runV2(
  routersToCheck: any[],
  assetsToCheck: {
    token: Asset;
    amount: number;
    borrowable?: boolean;
  }[],
  slippageTolerance: number,
  flashLoanFee: number,
  networkProviderUrl: string,
  arbitrageContractAddress: string,
  delay: number
) {
  logger.debug("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  const nonProfitableRoutesAndAssets: any[] = [];

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

    if (
      nonProfitableRoutesAndAssets.findIndex((nonProfitable) => {
        return (
          nonProfitable.router0 === router0 &&
          nonProfitable.router1 === router1 &&
          nonProfitable.token0 === token0.address &&
          nonProfitable.token1 === token1.address
        );
      }) !== -1
    )
      continue;

    const randomFactor = 0.5 + Math.random() * 0.5; // Generate a random factor between 0.5 and 1
    const amountIn =
      (toDecimals(borrowedAmount, token0.decimals) *
        BigInt(Math.floor(randomFactor * 100))) /
      BigInt(100);
    const expactedAmountOut =
      (amountIn * BigInt((1 + flashLoanFee) * 100_000)) / BigInt(100_000);

    logger.debug("Started arbitrage...");

    logger.debug(`Route0 (${getRouterName(router0)}): ${router0}`);
    logger.debug(`Route1 (${getRouterName(router1)}): ${router1}`);
    logger.debug(`Token0 (${getAssetName(token0.address)}): ${token0.address}`);
    logger.debug(`Token1 (${getAssetName(token1.address)}): ${token1.address}`);
    logger.debug(`amountIn: ${formatDecimals(amountIn, token0.decimals)}`);

    const result = await executeArbitrage(
      router0,
      router1,
      token0.address,
      token1.address,
      amountIn,
      expactedAmountOut,
      provider,
      arbitrageContractAddress
    );

    if (result) {
      logger.debug("✅ Arbitrage opportunity found!");
      logger.debug("Withdrawing funds...");

      if (await withdraw(token0.address, provider, arbitrageContractAddress)) {
        logger.debug(`🎉🎉🎉🎉🎉🎉🎉🎉 Arbitrage opportunity done\n\n`);
      } else {
        logger.debug(`❌ Error withdrawing funds\n\n`);
        process.exit(1);
      }
    } else {
      const amountOut = await checkArbitrage(
        router0,
        router1,
        token0.address,
        token1.address,
        amountIn,
        expactedAmountOut,
        provider,
        arbitrageContractAddress
      );
      logger.debug(`amountOut: ${formatDecimals(amountOut, token0.decimals)}`);
      if (amountOut === BigInt(0)) {
        nonProfitableRoutesAndAssets.push({
          router0,
          router1,
          token0: token0.address,
          token1: token1.address,
        });
      }

      logger.debug(`❌ Not an arbitrage opportunity\n\n`);
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
        expactedAmountOut
      );

      return amountOut;
    }
  } catch (error) {
    console.error("Error checking arbitrage", error);
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

    const receipt = await tx.wait();

    logger.debug(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.fatal({ error }, "Error performing arbitrage");
    logger.fatal(`Router0: ${router0}`);
    logger.fatal(`Router1: ${router1}`);
    logger.fatal(`Token0: ${token0}`);
    logger.fatal(`Token1: ${token1}`);
    logger.fatal(`amountIn: ${amountIn}`);
    logger.fatal(`expactedAmountOut: ${expactedAmountOut}`);
    logger.flush();
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
    logger.fatal({ error }, "Error withdrawing funds");
    logger.flush();
    return false;
  }
}
