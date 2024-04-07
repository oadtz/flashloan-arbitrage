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
  checkSellSignal: boolean,
  delay: number
) {
  logger.debug("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  const _trades: Record<
    string,
    { ethPrices: number[]; tokenPrices: number[] }
  > = {};

  assetsToCheck.forEach((asset) => {
    _trades[asset.address] = {
      ethPrices: [],
      tokenPrices: [],
    };
  });

  while (true) {
    const shuffledAssets = shuffle(assetsToCheck);
    const tokenToTrade =
      shuffledAssets[Math.floor(Math.random() * shuffledAssets.length)];

    logger.debug("Checking trade opportunities...");

    const trades = await getTrades(
      tokenToTrade.address,
      provider,
      tradeContractAddress
    );

    logger.debug(
      `Current _trades for ETH/${getAssetName(
        tokenToTrade.address
      )}: ${formatDecimals(trades.amountETH, 18)}:${formatDecimals(
        trades.amountToken,
        tokenToTrade.decimals
      )}`
    );
    logger.debug(
      `Current ETH balance: ${formatDecimals(
        await getETHBalance(provider, tradeContractAddress),
        18
      )}`
    );
    logger.debug(
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

    logger.debug(`Result from checkTrade`);
    logger.debug(`Direction: ${direction}`);
    logger.debug(`Router: ${router}`);
    logger.debug(`Amount ETH: ${amountEth}`);
    logger.debug(`Amount Token: ${amountToken}`);

    // Calculate Token Price
    if (_trades[tokenToTrade.address].tokenPrices.length > 500)
      _trades[tokenToTrade.address].tokenPrices.shift();

    _trades[tokenToTrade.address].tokenPrices.push(
      +formatDecimals(amountToken, tokenToTrade.decimals) /
        +formatDecimals(amountEth, 18)
    );

    // Calculate ETH Price
    if (_trades[tokenToTrade.address].ethPrices.length > 500)
      _trades[tokenToTrade.address].ethPrices.shift();

    _trades[tokenToTrade.address].ethPrices.push(
      +formatDecimals(amountEth, 18) /
        +formatDecimals(amountToken, tokenToTrade.decimals)
    );

    if (direction === "eth_to_token") {
      logger.debug(
        `Data Points: ${_trades[tokenToTrade.address].tokenPrices.length}`
      );

      const sellSignal = isSellSignal(
        _trades[tokenToTrade.address].tokenPrices
      );

      logger.debug(
        `Amount to trade: ${formatDecimals(amountToken, tokenToTrade.decimals)}`
      );
      logger.debug(
        `Price: ${
          +formatDecimals(amountToken, tokenToTrade.decimals) /
          +formatDecimals(amountEth, 18)
        } ${getAssetName(tokenToTrade.address)}/ETH`
      );
      logger.debug(`Sell Signal: ${sellSignal}`);
      if (
        (checkSellSignal && !sellSignal) ||
        trades.amountToken +
          (amountToken * BigInt(Math.floor(slippageTolerance * 10000))) /
            BigInt(1000000) >=
          amountToken
      ) {
        logger.warn(`❌ Price not good enough, waiting for better price`);
      } else {
        logger.debug(
          `🎉 Trade opportunity found! ${direction} ${formatDecimals(
            amountEth,
            18
          )} ETH for ${formatDecimals(
            amountToken,
            tokenToTrade.decimals
          )} ${getAssetName(tokenToTrade.address)} on ${getRouterName(router)}`
        );

        logger.debug(`executeTradeETHForTokens`);
        logger.debug(`Router: ${router}`);
        logger.debug(`Token: ${tokenToTrade.address}`);
        logger.debug(`Amount ETH: ${amountEth}`);
        logger.debug(`Amount Token: ${amountToken}`);
        logger.debug(`Gas limit: ${gasLimit}`);

        const result = await executeTradeETHForTokens(
          router,
          tokenToTrade.address,
          amountEth,
          trades.amountToken,
          provider,
          gasLimit,
          tradeContractAddress
        );

        if (result) {
          // _trades[tokenToTrade.address] = {
          //   ethData: [],
          //   tokenData: [],
          // };

          logger.debug(`🎉🎉🎉🎉🎉🎉🎉🎉 Trading done`);
        } else {
          `❌ Trading failed`;
          process.exit(1);
        }
      }
    } else if (direction === "token_to_eth") {
      logger.debug(
        `Data Points: ${_trades[tokenToTrade.address].ethPrices.length}`
      );

      const sellSignal = isSellSignal(_trades[tokenToTrade.address].ethPrices);

      logger.debug(`Amount to trade: ${formatDecimals(amountEth, 18)}`);
      logger.debug(
        `Price: ${
          +formatDecimals(amountEth, 18) /
          +formatDecimals(amountToken, tokenToTrade.decimals)
        } ETH/${getAssetName(tokenToTrade.address)}`
      );
      logger.debug(`Sell Signal: ${sellSignal}`);

      if (
        (checkSellSignal && !sellSignal) ||
        trades.amountETH +
          (amountEth * BigInt(Math.floor(slippageTolerance * 10000))) /
            BigInt(1000000) >=
          amountEth
      ) {
        logger.warn(`❌ Price not good enough, waiting for better price`);
      } else {
        logger.debug(
          `🎉 Trade opportunity found! ${direction} ${formatDecimals(
            amountToken,
            tokenToTrade.decimals
          )} ${getAssetName(tokenToTrade.address)} for ${formatDecimals(
            amountEth,
            18
          )} ETH on ${getRouterName(router)}`
        );

        logger.debug(`executeTradeTokensForETH`);
        logger.debug(`Router: ${router}`);
        logger.debug(`Token: ${tokenToTrade.address}`);
        logger.debug(`Amount Token: ${amountToken}`);
        logger.debug(`Amount ETH: ${amountEth}`);
        logger.debug(`Gas limit: ${gasLimit}`);

        const result = await executeTradeTokensForETH(
          router,
          tokenToTrade.address,
          amountToken,
          trades.amountETH,
          provider,
          gasLimit,
          tradeContractAddress
        );

        if (result) {
          // _trades[tokenToTrade.address] = {
          //   ethData: [],
          //   tokenData: [],
          // };

          logger.debug(`🎉🎉🎉🎉🎉🎉🎉🎉 Trading done`);
        } else {
          logger.fatal(`❌ Trading failed`);
          process.exit(1);
        }
      }
    } else {
      _trades[tokenToTrade.address] = {
        ethPrices: [],
        tokenPrices: [],
      };
      logger.warn(`❌ Not a trade opportunity`);
    }

    logger.debug(
      `After ETH balance: ${formatDecimals(
        await getETHBalance(provider, tradeContractAddress),
        18
      )}`
    );
    logger.debug(
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
  logger.debug("🚀 Starting withdrawal...");

  const provider = getProvider(networkProviderUrl);

  for (const asset of assetsToWithdraw) {
    result = await withdrawToken(
      asset.address,
      provider,
      gasLimit,
      tradeContractAddress
    );

    if (result) {
      await resetTokenTrade(
        asset.address,
        provider,
        gasLimit,
        tradeContractAddress
      );

      logger.debug(`🎉 Withdrawal of ${getAssetName(asset.address)} done`);
    } else {
      logger.fatal(`❌ Withdrawal of ${getAssetName(asset.address)} failed`);
      process.exit(1);
    }
  }

  result = await withdrawETH(provider, gasLimit, tradeContractAddress);

  if (result) {
    logger.debug(`🎉 Withdrawal of ETH done`);
  } else {
    logger.fatal(`❌ Withdrawal of ETH failed`);
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
  amountETH: bigint;
  amountToken: bigint;
}> {
  try {
    if (tradeContractAddress) {
      const trader = new ethers.Contract(
        tradeContractAddress,
        tradeAbi,
        provider.ethers
      );

      const [amountETH, amountToken] = await trader.getTrades(tokenToCheck);

      return { amountETH: BigInt(amountETH), amountToken: BigInt(amountToken) };
    }
  } catch (error) {
    console.error("Error getting _trades", error);
  }

  return { amountETH: BigInt(0), amountToken: BigInt(0) };
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

    logger.debug(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.fatal({ error }, "Error performing executeTradeETHForTokens");
    logger.fatal(`Router: ${router}`);
    logger.fatal(`Token: ${token}`);
    logger.fatal(`Amount In: ${amountIn}`);
    logger.fatal(`Expected Amount Out: ${expectedAmountOut}`);
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

    logger.debug(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.fatal({ error }, "Error performing executeTradeTokensForETH");
    logger.fatal(`Router (${getRouterName(router)}): ${router}`);
    logger.fatal(`Token: ${token}`);
    logger.fatal(`Amount In: ${amountIn}`);
    logger.fatal(`Expected Amount Out: ${expectedAmountOut}`);
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

    logger.debug(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.fatal({ error }, "Error withdrawing ETH");
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

    logger.debug(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.fatal({ error }, "Error withdrawing tokens");
    logger.flush();
    return false;
  }
}

export async function resetTokenTrade(
  token: string,
  provider: Provider,
  gasLimit: number,
  tradeContractAddress: string
) {
  if (!tradeContractAddress) return false; // Skip resetting if no contract address is provided

  try {
    const contract = new ethers.Contract(
      tradeContractAddress,
      tradeAbi,
      provider.wallet
    );

    const tx = await contract.resetTokenTrade(token, {
      gasLimit: 3000000,
    });

    const receipt = await tx.wait();

    logger.debug(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.fatal({ error }, "Error reset token trades");
    logger.flush();
    return false;
  }
}
