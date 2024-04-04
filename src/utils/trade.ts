import { ethers } from "ethers";
import { Asset, getAssetName } from "../config/assets";
import { abi as tradeAbi } from "../config/trade";
import { getRouterName } from "../config/dex";
import { shuffle } from "lodash";
import logger from "./logger";
import { Provider, formatDecimals, getGasPrice, getProvider } from "./provider";
import { isSellSignal } from "./is-sell-signal";

export async function run(
  routersToCheck: string[],
  assetsToCheck: Asset[],
  slippageTolerance: number,
  gasLimit: number,
  networkProviderUrl: string,
  tradeContractAddress: string,
  movingAvarageCheck: boolean,
  delay: number
) {
  logger.info("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  const _trades: Record<string, { ethData: number[]; tokenData: number[] }> =
    {};
  const smoothingFactor = BigInt(2);

  assetsToCheck.forEach((asset) => {
    _trades[asset.address] = {
      ethData: [],
      tokenData: [],
    };
  });

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

    logger.info(`Result from checkTrade`);
    logger.info(`Direction: ${direction}`);
    logger.info(`Router: ${router}`);
    logger.info(`Amount ETH: ${amountEth}`);
    logger.info(`Amount Token: ${amountToken}`);

    if (direction === "eth_to_token") {
      if (_trades[tokenToTrade.address].tokenData.length > 1000)
        _trades[tokenToTrade.address].tokenData.shift();

      _trades[tokenToTrade.address].tokenData.push(
        Number(formatDecimals(amountToken, tokenToTrade.decimals))
      );

      const sellSignal = isSellSignal(
        _trades[tokenToTrade.address].tokenData,
        5,
        10,
        14,
        70,
        14,
        80
      );

      logger.info(
        `Amount to trade: ${formatDecimals(amountToken, tokenToTrade.decimals)}`
      );
      logger.info(`Sell Signal: ${sellSignal}`);
      if (movingAvarageCheck && !sellSignal) {
        logger.warn(`❌ Price not good enough, waiting for better price`);
      } else {
        logger.info(
          `🎉 Trade opportunity found! ${direction} ${formatDecimals(
            amountEth,
            18
          )} ETH for ${formatDecimals(
            amountToken,
            tokenToTrade.decimals
          )} ${getAssetName(tokenToTrade.address)} on ${getRouterName(router)}`
        );

        logger.info(`executeTradeETHForTokens`);
        logger.info(`Router: ${router}`);
        logger.info(`Token: ${tokenToTrade.address}`);
        logger.info(`Amount ETH: ${amountEth}`);
        logger.info(`Amount Token: ${amountToken}`);
        logger.info(`Gas limit: ${gasLimit}`);

        const result = await executeTradeETHForTokens(
          router,
          tokenToTrade.address,
          amountEth,
          amountToken -
            (amountToken * BigInt(Math.floor(slippageTolerance * 10000))) /
              BigInt(1000000),
          provider,
          gasLimit,
          tradeContractAddress
        );

        if (result) {
          _trades[tokenToTrade.address] = {
            ethData: [],
            tokenData: [],
          };

          logger.info(`🎉🎉🎉🎉🎉🎉🎉🎉 Trading done`);
        } else {
          logger.error(`❌ Trading failed`);
          process.exit(1);
        }
      }
    } else if (direction === "token_to_eth") {
      if (_trades[tokenToTrade.address].ethData.length > 1000)
        _trades[tokenToTrade.address].ethData.shift();

      _trades[tokenToTrade.address].ethData.push(
        Number(formatDecimals(amountEth, 18))
      );
      const sellSignal = isSellSignal(
        _trades[tokenToTrade.address].ethData,
        5,
        10,
        14,
        70,
        14,
        80
      );

      logger.info(`Amount to trade: ${formatDecimals(amountEth, 18)}`);
      logger.info(`Sell Signal: ${sellSignal}`);
      if (movingAvarageCheck && !sellSignal) {
        logger.warn(`❌ Price not good enough, waiting for better price`);
      } else {
        logger.info(
          `🎉 Trade opportunity found! ${direction} ${formatDecimals(
            amountToken,
            tokenToTrade.decimals
          )} ${getAssetName(tokenToTrade.address)} for ${formatDecimals(
            amountEth,
            18
          )} ETH on ${getRouterName(router)}`
        );

        logger.info(`executeTradeTokensForETH`);
        logger.info(`Router: ${router}`);
        logger.info(`Token: ${tokenToTrade.address}`);
        logger.info(`Amount Token: ${amountToken}`);
        logger.info(`Amount ETH: ${amountEth}`);
        logger.info(`Gas limit: ${gasLimit}`);

        const result = await executeTradeTokensForETH(
          router,
          tokenToTrade.address,
          amountToken,
          amountEth -
            (amountEth * BigInt(Math.floor(slippageTolerance * 10000))) /
              BigInt(1000000),
          provider,
          gasLimit,
          tradeContractAddress
        );

        if (result) {
          _trades[tokenToTrade.address] = {
            ethData: [],
            tokenData: [],
          };

          logger.info(`🎉🎉🎉🎉🎉🎉🎉🎉 Trading done`);
        } else {
          logger.error(`❌ Trading failed`);
          process.exit(1);
        }
      }
    } else {
      _trades[tokenToTrade.address] = {
        ethData: [],
        tokenData: [],
      };
      logger.warn(`❌ Not a trade opportunity`);
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

export async function withdrawTrade(
  assetsToWithdraw: Asset[],
  networkProviderUrl: string,
  gasLimit: number,
  tradeContractAddress: string
) {
  let result: boolean = false;
  logger.info("🚀 Starting withdrawal...");

  const provider = getProvider(networkProviderUrl);

  for (const asset of assetsToWithdraw) {
    result = await withdrawToken(
      asset.address,
      provider,
      gasLimit,
      tradeContractAddress
    );

    if (result) {
      logger.info(`🎉 Withdrawal of ${getAssetName(asset.address)} done`);
    } else {
      logger.error(`❌ Withdrawal of ${getAssetName(asset.address)} failed`);
      process.exit(1);
    }
  }

  result = await withdrawETH(provider, gasLimit, tradeContractAddress);

  if (result) {
    logger.info(`🎉 Withdrawal of ETH done`);
  } else {
    logger.error(`❌ Withdrawal of ETH failed`);
    process.exit(1);
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
        gasLimit: 25000000,
      }
    );

    const receipt = await tx.wait();

    logger.info(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.error({ error }, "Error performing executeTradeETHForTokens");
    logger.error(`Router: ${router}`);
    logger.error(`Token: ${token}`);
    logger.error(`Amount In: ${amountIn}`);
    logger.error(`Expected Amount Out: ${expectedAmountOut}`);
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
        gasLimit: 25000000,
      }
    );

    const receipt = await tx.wait();

    logger.info(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.error({ error }, "Error performing executeTradeTokensForETH");
    logger.error(`Router (${getRouterName(router)}): ${router}`);
    logger.error(`Token: ${token}`);
    logger.error(`Amount In: ${amountIn}`);
    logger.error(`Expected Amount Out: ${expectedAmountOut}`);
    logger.flush();
    return false;
  }
}

export async function withdrawETH(
  provider: Provider,
  gasLimit: number,
  tradeContractAddress: string
) {
  if (!tradeContractAddress) return false; // Skip withdrawal if no contract address is provided

  try {
    const contract = new ethers.Contract(
      tradeContractAddress,
      tradeAbi,
      provider.wallet
    );

    const tx = await contract.withdrawETH({
      gasLimit: 3000000,
    });

    const receipt = await tx.wait();

    logger.info(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.error({ error }, "Error withdrawing ETH");
    logger.flush();
    return false;
  }
}

export async function withdrawToken(
  token: string,
  provider: Provider,
  gasLimit: number,
  tradeContractAddress: string
) {
  if (!tradeContractAddress) return false; // Skip withdrawal if no contract address is provided

  try {
    const contract = new ethers.Contract(
      tradeContractAddress,
      tradeAbi,
      provider.wallet
    );

    const tx = await contract.withdrawToken(token, {
      gasLimit: 3000000,
    });

    const receipt = await tx.wait();

    logger.info(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.error({ error }, "Error withdrawing tokens");
    logger.flush();
    return false;
  }
}
