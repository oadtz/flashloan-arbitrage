import { ethers } from "ethers";
import { Asset, getAssetName } from "../config/assets";
import { abi as tradeAbi } from "../config/trade";
import { getRouterName } from "../config/dex";
import { shuffle } from "lodash";
import logger from "./logger";
import { Provider, formatDecimals, getGasPrice, getProvider } from "./provider";

export async function run(
  routersToCheck: string[],
  assetsToCheck: Asset[],
  slippageTolerance: number,
  gasLimit: number,
  networkProviderUrl: string,
  tradeContractAddress: string,
  delay: number
) {
  logger.info("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  while (true) {
    const shuffledAssets = shuffle(assetsToCheck);
    const tokenToTrade =
      shuffledAssets[Math.floor(Math.random() * shuffledAssets.length)];

    logger.info("Checking trade opportunities...");

    const trades = await getTrades(
      tokenToTrade.address,
      provider,
      tradeContractAddress
    );

    logger.info(
      `Current _trades for ETH/${getAssetName(
        tokenToTrade.address
      )}: ${formatDecimals(trades.amoutEth, 18)}:${formatDecimals(
        trades.amountToken,
        tokenToTrade.decimals
      )}`
    );
    logger.info(
      `Current ETH balance: ${formatDecimals(
        await getETHBalance(provider, tradeContractAddress),
        18
      )}`
    );
    logger.info(
      `Current token balance: ${formatDecimals(
        await getTokenBalance(
          tokenToTrade.address,
          provider,
          tradeContractAddress
        ),
        tokenToTrade.decimals
      )}`
    );

    const gasPrice = await getGasPrice(provider);
    const [direction, router, amountEth, amountToken] = await checkTrade(
      routersToCheck,
      tokenToTrade.address,
      provider,
      BigInt(gasLimit) * gasPrice,
      tradeContractAddress
    );

    if (direction === "eth_to_token") {
      logger.info(
        `🎉 Trade opportunity found! ${direction} ${formatDecimals(
          amountEth,
          18
        )} ETH for ${formatDecimals(
          amountToken,
          tokenToTrade.decimals
        )} ${getAssetName(tokenToTrade.address)} on ${getRouterName(router)}`
      );

      const result = await executeTradeETHForTokens(
        router,
        tokenToTrade.address,
        amountEth,
        amountToken,
        provider,
        gasLimit,
        tradeContractAddress
      );

      if (result) {
        logger.info(`🎉🎉🎉🎉🎉🎉🎉🎉 Trading done`);
      } else {
        logger.info(`❌ Trading failed`);
      }
    } else if (direction === "token_to_eth") {
      logger.info(
        `🎉 Trade opportunity found! ${direction} ${formatDecimals(
          amountToken,
          tokenToTrade.decimals
        )} ${getAssetName(tokenToTrade.address)} for ${formatDecimals(
          amountEth,
          18
        )} ETH on ${getRouterName(router)}`
      );

      const result = await executeTradeTokensForETH(
        router,
        tokenToTrade.address,
        amountToken,
        amountEth,
        provider,
        gasLimit,
        tradeContractAddress
      );

      if (result) {
        logger.info(`🎉🎉🎉🎉🎉🎉🎉🎉 Trading done`);
      } else {
        logger.info(`❌ Trading failed`);
      }
    } else {
      logger.info(`❌ Not a trade opportunity`);
    }

    logger.info(
      `After ETH balance: ${formatDecimals(
        await getETHBalance(provider, tradeContractAddress),
        18
      )}`
    );
    logger.info(
      `After token balance: ${formatDecimals(
        await getTokenBalance(
          tokenToTrade.address,
          provider,
          tradeContractAddress
        ),
        tokenToTrade.decimals
      )}\n\n`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

async function getTokenBalance(
  tokenToCheck: string,
  provider: Provider,
  tradeContractAddress: string
): Promise<bigint> {
  try {
    if (tradeContractAddress) {
      const trader = new ethers.Contract(
        tradeContractAddress,
        tradeAbi,
        provider.ethers
      );

      const balance = await trader.getTokenBalance(tokenToCheck);

      return balance;
    }
  } catch (error) {
    console.error("Error getting token balance", error);
  }

  return BigInt(0);
}

async function getETHBalance(
  provider: Provider,
  tradeContractAddress: string
): Promise<bigint> {
  try {
    if (tradeContractAddress) {
      const trader = new ethers.Contract(
        tradeContractAddress,
        tradeAbi,
        provider.ethers
      );

      const balance = await trader.getETHBalance();

      return balance;
    }
  } catch (error) {
    console.error("Error getting ETH balance", error);
  }

  return BigInt(0);
}

async function getTrades(
  tokenToCheck: string,
  provider: Provider,
  tradeContractAddress: string
): Promise<{
  amoutEth: bigint;
  amountToken: bigint;
}> {
  try {
    if (tradeContractAddress) {
      const trader = new ethers.Contract(
        tradeContractAddress,
        tradeAbi,
        provider.ethers
      );

      const [amoutETH, amountToken] = await trader.getTrades(tokenToCheck);

      return { amoutEth: BigInt(amoutETH), amountToken: BigInt(amountToken) };
    }
  } catch (error) {
    console.error("Error getting _trades", error);
  }

  return { amoutEth: BigInt(0), amountToken: BigInt(0) };
}

async function checkTrade(
  routersToCheck: string[],
  tokenToTrade: string,
  provider: Provider,
  gasLimit: bigint,
  tradeContractAddress: string
): Promise<["eth_to_token" | "token_to_eth" | "none", string, bigint, bigint]> {
  try {
    if (tradeContractAddress) {
      const trader = new ethers.Contract(
        tradeContractAddress,
        tradeAbi,
        provider.ethers
      );

      const [direction, router, amountETHToTrade, amountTokenToTrade] =
        await trader.checkTrade(routersToCheck, tokenToTrade, gasLimit);

      return [direction, router, amountETHToTrade, amountTokenToTrade];
    }
  } catch (error) {
    console.error("Error checking trade", error);
  }

  return ["none", "", BigInt(0), BigInt(0)];
}

async function executeTradeETHForTokens(
  router: string,
  token: string,
  amountIn: bigint,
  expectedAmountOut: bigint,
  provider: Provider,
  gasLimit: number,
  tradeContractAddress: string
): Promise<boolean> {
  if (!tradeContractAddress) return false; // Skip trading if no contract address is provided

  try {
    const trader = new ethers.Contract(
      tradeContractAddress,
      tradeAbi,
      provider.wallet
    );

    const tx = await trader.executeTradeETHForTokens(
      router,
      token,
      amountIn,
      expectedAmountOut,
      {
        gasLimit: 3000000,
      }
    );

    await tx.wait();

    return true;
  } catch (error) {
    logger.error({ error }, "Error performing tradeEthForTokens");
    logger.flush();
    return false;
  }
}

async function executeTradeTokensForETH(
  router: string,
  token: string,
  amountIn: bigint,
  expectedAmountOut: bigint,
  provider: Provider,
  gasLimit: number,
  tradeContractAddress: string
): Promise<boolean> {
  if (!tradeContractAddress) return false; // Skip trading if no contract address is provided

  try {
    const trader = new ethers.Contract(
      tradeContractAddress,
      tradeAbi,
      provider.wallet
    );

    const tx = await trader.executeTradeTokensForETH(
      router,
      token,
      amountIn,
      expectedAmountOut,
      {
        gasLimit: 3000000,
      }
    );

    await tx.wait();

    return true;
  } catch (error) {
    logger.error({ error }, "Error performing tradeTokensForETH");
    logger.flush();
    return false;
  }
}

export async function withdraw(
  token: string,
  provider: Provider,
  gasLimit: bigint,
  tradeContractAddress: string
) {
  if (!tradeContractAddress) return false; // Skip withdrawal if no contract address is provided

  try {
    const contract = new ethers.Contract(
      tradeContractAddress,
      tradeAbi,
      provider.wallet
    );

    const tx = await contract.withdraw(token, {
      gasLimit,
    });

    await tx.wait();

    return true;
  } catch (error) {
    logger.error({ error }, "Error withdrawing funds");
    logger.flush();
    return false;
  }
}
