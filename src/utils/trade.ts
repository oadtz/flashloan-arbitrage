import { ethers } from "ethers";
import { Asset, getAssetName } from "../config/assets";
import { abi as tradeAbi } from "../config/trade";
import { getRouterName } from "../config/dex";
import logger from "./logger";
import { Provider, getGasPrice, getProvider } from "./provider";

export async function run(
  routersToCheck: string[],
  tokenToTrade: Asset,
  slippageTolerance: number,
  gasLimit: number,
  networkProviderUrl: string,
  tradeContractAddress: string,
  delay: number
) {
  logger.info("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);
  const gasPrice = await getGasPrice(provider);

  while (true) {
    logger.info("Checking trade opportunities...");

    logger.info(`Routers: [${routersToCheck.join(", ")}]`);
    logger.info(
      `Token (${getAssetName(tokenToTrade.address)}): ${tokenToTrade.address}`
    );

    const [direction, router, amountEth, amountToken] = await checkTrade(
      routersToCheck,
      tokenToTrade.address,
      provider,
      BigInt(gasLimit) * gasPrice,
      tradeContractAddress
    );

    if (direction === "buy") {
      logger.info(
        `🎉 Trade opportunity found! ${direction} ${amountEth} ETH for ${amountToken} ${getAssetName(
          tokenToTrade.address
        )} on ${getRouterName(router)}`
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
        logger.info(`🎉🎉🎉🎉🎉🎉🎉🎉 Trading done\n\n`);
      } else {
        logger.info(`❌ Trading failed\n\n`);
      }
    } else if (direction === "sell") {
      logger.info(
        `🎉 Trade opportunity found! ${direction} ${amountToken} ${getAssetName(
          tokenToTrade.address
        )} for ${amountEth} ETH on ${getRouterName(router)}`
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
    } else {
      logger.info(`❌ Not a trade opportunity\n\n`);
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

async function checkTrade(
  routersToCheck: string[],
  tokenToTrade: string,
  provider: Provider,
  gasLimit: bigint,
  tradeContractAddress: string
): Promise<["buy" | "sell" | "none", string, bigint, bigint]> {
  try {
    if (tradeContractAddress) {
      const trader = new ethers.Contract(
        tradeContractAddress,
        tradeAbi,
        provider.ethers
      );

      const [direction, router, amountEth, amountToken] =
        await trader.checkTrade(routersToCheck, tokenToTrade, gasLimit);

      return [direction, router, amountEth, amountToken];
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
        gasLimit,
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
        gasLimit,
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
