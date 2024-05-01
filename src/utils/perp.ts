import { ethers } from "ethers";
import { Provider, formatDecimals, getProvider, toDecimals } from "./provider";
import { abi as perpAbi } from "../config/perp";
import { Asset } from "../config/assets";
import logger from "./logger";
import { isShortSignal, isLongSignal, isROISellSignal } from "./trade-analysis";
import _ from "lodash";
import { BigUnit } from "bigunit";

export async function run(
  tokenToTrade: Asset,
  networkProviderUrl: string,
  perpContractAddress: string,
  leverage: number,
  delay: number
) {
  console.log("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  const _prices: number[] = [];
  let _roi: number[] = [];
  let _lastPosition: "short" | "long" | null = null;
  let _tradeHash = "";
  let epoch = 0;
  const openPosition = {
    price: BigInt(0),
    amount: BigInt(0),
    pnl: BigInt(0),
  };

  const perpPortal = new ethers.Contract(
    perpContractAddress,
    perpAbi,
    provider.ethers
  );

  perpPortal.on(
    "MarketPendingTrade",
    (address: string, tradeHash: string, data: any) => {
      if (address === provider.wallet.address) {
        _tradeHash = tradeHash;
        console.log("New trade hash", tradeHash);
      }
    }
  );

  while (true) {
    // Get current BNB price & balance
    const currentPrice = await getBNBPrice(
      tokenToTrade.address,
      perpContractAddress,
      provider
    );
    let currentBalance = await getBalance(provider);

    console.log(`Epoch: ${epoch}`);
    console.log("Current price", formatDecimals(currentPrice!, 18));
    console.log("Current balance", formatDecimals(currentBalance!, 18));

    if (_prices.length > 500) _prices.shift();

    _prices.push(+formatDecimals(currentPrice!, 18));

    const { short: shortSignal, indicators } = isShortSignal(_prices);
    const { long: longSignal } = isLongSignal(_prices);

    console.log(`Long Term Signal: ${indicators.longTermSignal}`);
    console.log(`Short Term Signal: ${indicators.shortTermSignal}`);
    console.log(`Short Signal: ${shortSignal}`);
    console.log(`Long Signal: ${longSignal}`);

    if (_lastPosition !== null)
      console.log(`Current position: ${_lastPosition}`);
    if (openPosition.price !== BigInt(0))
      console.log(`Entry price: ${formatDecimals(openPosition.price, 18)}`);

    if (currentPrice && currentBalance) {
      if (openPosition.amount > 0) {
        const roi = calculateROI(
          currentPrice,
          leverage,
          openPosition,
          _lastPosition!
        );
        console.log(`ROI: ${roi}%`);
        openPosition.pnl = toDecimals(
          Math.round(+formatDecimals(openPosition.amount, 0) * (1 + roi / 100)),
          0
        );
        console.log(`PNL: ${formatDecimals(openPosition.pnl, 18)}`);

        if (_roi.length > 500) _roi.shift();

        _roi.push(roi);

        if (
          isROISellSignal(_roi) ||
          (longSignal && _lastPosition !== "long") ||
          (shortSignal && _lastPosition !== "short")
        ) {
          console.log("👁️ Stop loss/Take profit/Reversal signal detected");
          await closeTrade(_tradeHash, perpContractAddress, provider);
          console.log(`Closed last trade ${_tradeHash}\n\n`);
          _lastPosition = null;
          _roi = [];
          _tradeHash = "";

          openPosition.amount = BigInt(0);
          openPosition.price = BigInt(0);
          openPosition.pnl = BigInt(0);

          //currentBalance = await getBalance(provider);
          continue;
        }
      }

      if (_lastPosition === null && shortSignal) {
        console.log("⬇️ Short signal detected");

        // if (await closeTrade(_tradeHash, perpContractAddress, provider)) {
        //   console.log(`Closed last trade ${_tradeHash}`);
        //   _lastPosition = null;
        //   _roi = [];
        //   _tradeHash = "";

        //   openPosition.amount = BigInt(0);
        //   openPosition.price = BigInt(0);
        //   openPosition.pnl = BigInt(0);
        // }

        const result = await openTrade(
          tokenToTrade.address,
          false,
          currentBalance / BigInt(2),
          currentPrice,
          perpContractAddress,
          provider
        );

        if (result) {
          console.log("Opened short trade successfully");

          openPosition.amount = currentBalance / BigInt(2);
          openPosition.price = (currentPrice * BigInt(999)) / BigInt(1000);
          _lastPosition = "short";
        } else {
          console.log("☹️ Cannot open short trade, wait for next signal");
        }
      } else if (_lastPosition === null && longSignal) {
        console.log("⬆️ Long signal detected");

        // if (await closeTrade(_tradeHash, perpContractAddress, provider)) {
        //   console.log(`Closed last trade ${_tradeHash}`);
        //   _lastPosition = null;
        //   _roi = [];
        //   _tradeHash = "";

        //   openPosition.amount = BigInt(0);
        //   openPosition.price = BigInt(0);
        //   openPosition.pnl = BigInt(0);
        // }

        const result = await openTrade(
          tokenToTrade.address,
          true,
          currentBalance / BigInt(2),
          currentPrice,
          perpContractAddress,
          provider
        );

        if (result) {
          console.log("Opened long trade successfully");

          openPosition.amount = currentBalance / BigInt(2);
          openPosition.price = (currentPrice * BigInt(1001)) / BigInt(1000);
          _lastPosition = "long";
        } else {
          console.log("☹️ Cannot open long trade, wait for next signal");
        }
      } else {
        console.log("❌ No signal detected");
      }
    }

    epoch++;
    console.log("\n\n");
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

function calculateROI(
  price: bigint,
  leverage: number,
  position: any,
  lastPosition?: string
) {
  let adjustedPrice = price;
  if (lastPosition === "long")
    adjustedPrice = (price * BigInt(1001)) / BigInt(1000);
  else if (lastPosition === "short")
    adjustedPrice = (price * BigInt(999)) / BigInt(1000);
  const openPrice = +formatDecimals(position.price, 18);
  const currentPrice = +formatDecimals(adjustedPrice, 18);

  const roi =
    lastPosition === "long"
      ? (currentPrice - openPrice) / openPrice
      : (openPrice - currentPrice) / openPrice;

  return roi * leverage * 100;
}

async function getBalance(provider: Provider) {
  try {
    const balance = await provider.ethers.getBalance(provider.wallet.address);

    return balance;
  } catch (error) {
    console.error("Error getBalance", error);
    return BigInt(0);
  }
}
async function getBNBPrice(
  tokenAddress: string,
  perpContractAddress: string,
  provider: Provider
): Promise<bigint | null> {
  try {
    const perp = new ethers.Contract(
      perpContractAddress,
      perpAbi,
      provider.ethers
    );

    const baseLinePrice = await perp.getPrice(tokenAddress);

    return toDecimals(baseLinePrice, 10);
  } catch (error) {
    console.error("Error getBaseLinePrice", error);
  }

  return BigInt(0);
}

async function closeTrade(
  tradeHash: string,
  perpContractAddress: string,
  provider: Provider
) {
  if (!tradeHash) return true; // Skip closing if no trade hash is provided

  try {
    const perp = new ethers.Contract(
      perpContractAddress,
      perpAbi,
      provider.wallet
    );

    const tx = await perp.closeTrade(tradeHash);

    await tx.wait();

    return true;
  } catch (error) {
    console.error("Error closeTrade", error);
    return false;
  }
}

async function openTrade(
  tokenAddress: string,
  isLong: boolean,
  amount: bigint,
  price: bigint,
  perpContractAddress: string,
  provider: Provider
) {
  try {
    const perp = new ethers.Contract(
      perpContractAddress,
      perpAbi,
      provider.wallet
    );

    const openDataInput = {
      pairBase: tokenAddress,
      isLong: isLong,
      tokenIn: "0x0000000000000000000000000000000000000000",
      amountIn: amount,
      qty: Math.round(+formatDecimals(amount * BigInt(49), 8)),
      price: isLong
        ? Math.round(+formatDecimals(price, 10) * 2)
        : Math.round(+formatDecimals(price, 10) * 0.75),
      stopLoss: 0,
      takeProfit: isLong
        ? Math.round(+formatDecimals(price, 10) * 4)
        : Math.round(+formatDecimals(price, 10) * 0.5),
      broker: 2,
    };
    console.log("Open trade data", openDataInput);
    const tx = await perp.openMarketTradeBNB(openDataInput, {
      value: amount,
    });

    await tx.wait();

    return true;
  } catch (error) {
    logger.error({ error }, "Error openMarketTradeBNB");
    logger.flush();
    return false;
  }
}

export async function withdraw(
  networkProviderUrl: string,
  gasLimit: number,
  perpContractAddress: string
) {
  if (!perpContractAddress) return false; // Skip withdrawal if no contract address is provided
  console.log("🚀 Starting withdrawal...");

  const provider = getProvider(networkProviderUrl);

  try {
    const contract = new ethers.Contract(
      perpContractAddress,
      perpAbi,
      provider.wallet
    );

    const tx = await contract.withdrawBNB({
      gasLimit,
    });

    const receipt = await tx.wait();

    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

    return true;
  } catch (error) {
    logger.error({ error }, "Error withdrawing BNB");
    logger.flush();
    return false;
  }
}
