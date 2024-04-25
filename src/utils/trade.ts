import { ethers } from "ethers";
import { Asset, getAssetName } from "../config/assets";
import { abi as tradeAbi } from "../config/trade";
import { getRouterName } from "../config/dex";
import { shuffle } from "lodash";
import logger from "./logger";
import {
  Provider,
  formatDecimals,
  getGasPrice,
  getProvider,
  toDecimals,
} from "./provider";
import { isSellSignal } from "./trade-analysis";

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
  console.log("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  const _trades: Record<
    string,
    { ethPrices: number[]; tokenPrices: number[] }
  > = {};

  const initialAmounts: Record<
    string,
    { amountEth: bigint; amountToken: bigint }
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

    console.log("Checking trade opportunities...");

    const trades = await getTrades(
      tokenToTrade.address,
      provider,
      tradeContractAddress
    );

    console.log(
      `Current _trades for ETH/${getAssetName(
        tokenToTrade.address
      )}: ${formatDecimals(trades.amountETH, 18)}:${formatDecimals(
        trades.amountToken,
        tokenToTrade.decimals
      )}`
    );
    console.log(
      `Current ETH balance: ${formatDecimals(
        await getETHBalance(provider, tradeContractAddress),
        18
      )}`
    );
    console.log(
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
    const [direction, router, amountEth, amountToken, baseLinePrice] =
      await checkTrade(
        routersToCheck,
        tokenToTrade,
        provider,
        BigInt(gasLimit) * gasPrice,
        tradeContractAddress
      );

    if (!initialAmounts[tokenToTrade.address]) {
      initialAmounts[tokenToTrade.address] = {
        amountEth,
        amountToken,
      };
    }

    console.log(`Result from checkTrade`);
    console.log(`Direction: ${direction}`);
    console.log(`Router: ${router}`);
    console.log(`Amount ETH: ${amountEth}`);
    console.log(`Amount Token: ${amountToken}`);

    // Calculate Token Price
    if (_trades[tokenToTrade.address].tokenPrices.length > 500)
      _trades[tokenToTrade.address].tokenPrices.shift();

    _trades[tokenToTrade.address].tokenPrices.push(baseLinePrice);

    // Calculate ETH Price
    if (_trades[tokenToTrade.address].ethPrices.length > 500)
      _trades[tokenToTrade.address].ethPrices.shift();

    _trades[tokenToTrade.address].ethPrices.push(1 / baseLinePrice);

    if (direction === "eth_to_token") {
      console.log(
        `Data Points: ${_trades[tokenToTrade.address].tokenPrices.length}`
      );

      const { sell: sellSignal, indicators } = isSellSignal(
        _trades[tokenToTrade.address].tokenPrices
      );

      console.log(
        `Amount to trade: ${formatDecimals(amountToken, tokenToTrade.decimals)}`
      );
      console.log(
        `Price: ${
          +formatDecimals(amountToken, tokenToTrade.decimals) /
          +formatDecimals(amountEth, 18)
        } ${getAssetName(tokenToTrade.address)}/ETH`
      );
      console.log(`MACD Signal: ${indicators.macdSignal}`);
      console.log(`MACD: ${indicators.macd}`);
      console.log(`Stochastic D: ${indicators.stochasticD}`);
      console.log(`Stochastic K: ${indicators.stochasticK}`);
      console.log(`Sell Signal: ${sellSignal}`);
      if (
        checkSellSignal &&
        !sellSignal
        // ||
        // trades.amountToken +
        //   (amountToken * BigInt(Math.floor(slippageTolerance * 10000))) /
        //     BigInt(1000000) >=
        //   amountToken
      ) {
        console.warn(`❌ Price not good enough, waiting for better price`);
      } else {
        console.log(
          `🎉 Trade opportunity found! ${direction} ${formatDecimals(
            amountEth,
            18
          )} ETH for ${formatDecimals(
            amountToken,
            tokenToTrade.decimals
          )} ${getAssetName(tokenToTrade.address)} on ${getRouterName(router)}`
        );

        console.log(`executeTradeETHForTokens`);
        console.log(`Router: ${router}`);
        console.log(`Token: ${tokenToTrade.address}`);
        console.log(`Amount ETH: ${amountEth}`);
        console.log(`Amount Token: ${amountToken}`);
        console.log(`Gas limit: ${gasLimit}`);

        const result = await executeTradeETHForTokens(
          router,
          tokenToTrade.address,
          amountEth,
          // trades.amountToken // For price safe guard
          amountToken -
            (amountToken * BigInt(Math.floor(slippageTolerance * 10000))) /
              BigInt(1000000),
          provider,
          gasLimit,
          tradeContractAddress
        );

        if (result) {
          // _trades[tokenToTrade.address] = {
          //   ethData: [],
          //   tokenData: [],
          // };

          console.log(`🎉🎉🎉🎉🎉🎉🎉🎉 Trading done`);
        } else {
          `❌ Trading failed`;
          process.exit(1);
        }
      }
    } else if (direction === "token_to_eth") {
      console.log(
        `Data Points: ${_trades[tokenToTrade.address].ethPrices.length}`
      );

      const { sell: sellSignal, indicators } = isSellSignal(
        _trades[tokenToTrade.address].ethPrices
      );

      console.log(`Amount to trade: ${formatDecimals(amountEth, 18)}`);
      console.log(
        `Price: ${
          +formatDecimals(amountEth, 18) /
          +formatDecimals(amountToken, tokenToTrade.decimals)
        } ETH/${getAssetName(tokenToTrade.address)}`
      );
      console.log(`MACD Signal: ${indicators.macdSignal}`);
      console.log(`MACD: ${indicators.macd}`);
      console.log(`Stochastic D: ${indicators.stochasticD}`);
      console.log(`Stochastic K: ${indicators.stochasticK}`);
      console.log(`Sell Signal: ${sellSignal}`);

      if (
        checkSellSignal &&
        !sellSignal
        // ||
        // trades.amountETH +
        //   (amountEth * BigInt(Math.floor(slippageTolerance * 10000))) /
        //     BigInt(1000000) >=
        //   amountEth
      ) {
        console.warn(`❌ Price not good enough, waiting for better price`);
      } else {
        console.log(
          `🎉 Trade opportunity found! ${direction} ${formatDecimals(
            amountToken,
            tokenToTrade.decimals
          )} ${getAssetName(tokenToTrade.address)} for ${formatDecimals(
            amountEth,
            18
          )} ETH on ${getRouterName(router)}`
        );

        console.log(`executeTradeTokensForETH`);
        console.log(`Router: ${router}`);
        console.log(`Token: ${tokenToTrade.address}`);
        console.log(`Amount Token: ${amountToken}`);
        console.log(`Amount ETH: ${amountEth}`);
        console.log(`Gas limit: ${gasLimit}`);

        const result = await executeTradeTokensForETH(
          router,
          tokenToTrade.address,
          amountToken,
          // trades.amountETH // For price safe guard
          amountEth -
            (amountEth * BigInt(Math.floor(slippageTolerance * 10000))) /
              BigInt(1000000),
          provider,
          gasLimit,
          tradeContractAddress
        );

        if (result) {
          // _trades[tokenToTrade.address] = {
          //   ethData: [],
          //   tokenData: [],
          // };

          console.log(`🎉🎉🎉🎉🎉🎉🎉🎉 Trading done`);
        } else {
          console.error(`❌ Trading failed`);
          process.exit(1);
        }
      }
    } else {
      _trades[tokenToTrade.address] = {
        ethPrices: [],
        tokenPrices: [],
      };
      console.warn(`❌ Not a trade opportunity`);
    }

    console.log(
      `Updated ETH balance: ${formatDecimals(
        await getETHBalance(provider, tradeContractAddress),
        18
      )} (${
        (+formatDecimals(
          await getETHBalance(provider, tradeContractAddress),
          18
        ) *
          100) /
          +formatDecimals(initialAmounts[tokenToTrade.address].amountEth, 18) -
        100
      }%)`
    );
    console.log(
      `Updated token balance: ${formatDecimals(
        await getTokenBalance(
          tokenToTrade.address,
          provider,
          tradeContractAddress
        ),
        tokenToTrade.decimals
      )} (${
        (+formatDecimals(
          await getTokenBalance(
            tokenToTrade.address,
            provider,
            tradeContractAddress
          ),
          tokenToTrade.decimals
        ) *
          100) /
          +formatDecimals(
            initialAmounts[tokenToTrade.address].amountToken,
            tokenToTrade.decimals
          ) -
        100
      }%)\n\n`
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
  console.log("🚀 Starting withdrawal...");

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

      console.log(`🎉 Withdrawal of ${getAssetName(asset.address)} done`);
    } else {
      console.error(`❌ Withdrawal of ${getAssetName(asset.address)} failed`);
      process.exit(1);
    }
  }

  result = await withdrawETH(provider, gasLimit, tradeContractAddress);

  if (result) {
    console.log(`🎉 Withdrawal of ETH done`);
  } else {
    console.error(`❌ Withdrawal of ETH failed`);
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
  tokenToTrade: Asset,
  provider: Provider,
  gasLimit: bigint,
  tradeContractAddress: string
): Promise<
  ["eth_to_token" | "token_to_eth" | "none", string, bigint, bigint, number]
> {
  try {
    if (tradeContractAddress) {
      const trader = new ethers.Contract(
        tradeContractAddress,
        tradeAbi,
        provider.ethers
      );

      const [direction, router, amountETHToTrade, amountTokenToTrade] =
        await trader.checkTrade(routersToCheck, tokenToTrade.address, gasLimit);
      const baseLinePrice = await getBaseLinePrice(
        router,
        tokenToTrade.address,
        provider,
        tradeContractAddress
      );

      return [
        direction,
        router,
        amountETHToTrade,
        amountTokenToTrade,
        +formatDecimals(baseLinePrice, tokenToTrade.decimals),
      ];
    }
  } catch (error) {
    console.error("Error checking trade", error);
  }

  return ["none", "", BigInt(0), BigInt(0), 0];
}

async function getBaseLinePrice(
  router: string,
  token: string,
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

      const baseLinePrice = await trader.getBaseLinePrice(router, token);

      return baseLinePrice;
    }
  } catch (error) {
    console.error("Error getBaseLinePrice", error);
  }

  return BigInt(0);
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

    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

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

    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

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

    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

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

    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.error({ error }, "Error withdrawing tokens");
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

    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.error({ error }, "Error reset token trades");
    logger.flush();
    return false;
  }
}
