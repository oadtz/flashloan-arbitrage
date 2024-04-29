import { ethers } from "ethers";
import { Provider, formatDecimals, getProvider, toDecimals } from "./provider";
import { abi as perpAbi } from "../config/perp";
import { Asset } from "../config/assets";
import logger from "./logger";
import { isShortSignal, isLongSignal, isROISellSignal } from "./trade-analysis";

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

  let epoch = 0;
  const openPosition = {
    price: BigInt(0),
    amount: BigInt(0),
    pnl: BigInt(0),
  };

  while (true) {
    // Get current BNB price & balance
    const currentPrice = await getBNBPrice(tokenToTrade.address, provider);
    const currentBalance = await getBalance(perpContractAddress, provider);

    console.log(`Epoch: ${epoch}`);
    console.log("Current price", formatDecimals(currentPrice!, 18));
    console.log("Current balance", formatDecimals(currentBalance!, 18));

    if (currentPrice && currentBalance) {
      if (openPosition.amount > 0) {
        console.log(`Last position: ${_lastPosition}`);
        console.log(`Open position: ${formatDecimals(openPosition.price, 18)}`);
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

        if (roi <= -50 || isROISellSignal(_roi)) {
          console.log("Stop loss/Take profit signal detected");
          await closeTrade(perpContractAddress, provider);
          _lastPosition = null;
          _roi = [];

          openPosition.amount = BigInt(0);
          openPosition.price = BigInt(0);
          openPosition.pnl = BigInt(0);
        }
      }

      if (_prices.length > 500) _prices.shift();

      _prices.push(+formatDecimals(currentPrice, 18));

      const { short: shortSignal, indicators } = isShortSignal(_prices);
      const { long: longSignal } = isLongSignal(_prices);

      console.log(`Long Term Signal: ${indicators.longTermSignal}`);
      console.log(`Short Term Signal: ${indicators.shortTermSignal}`);
      console.log(`Short Signal: ${shortSignal}`);
      console.log(`Long Signal: ${longSignal}`);

      logger.warn({
        price0: 0,
        price1: 0,
        price2: +formatDecimals(currentPrice, 18),
        price3: 0,
        sell: _lastPosition !== "short" && shortSignal,
        buy: _lastPosition !== "long" && longSignal,
        ...indicators,
      });
      logger.flush();

      if (_lastPosition !== "short" && shortSignal) {
        console.log("⬇️ Short signal detected");

        if (await closeTrade(perpContractAddress, provider)) {
          console.log("Closed last trade");
          _lastPosition = null;
          _roi = [];

          openPosition.amount = BigInt(0);
          openPosition.price = BigInt(0);
          openPosition.pnl = BigInt(0);
        }

        const result = await openTrade(
          tokenToTrade.address,
          false,
          currentBalance / BigInt(2),
          currentPrice,
          perpContractAddress,
          provider
        );
        _lastPosition = "short";

        openPosition.amount = currentBalance / BigInt(2);
        openPosition.price = currentPrice;

        if (result) {
          console.log("Opened short trade successfully");
          _lastPosition = "short";
        }
      } else if (_lastPosition !== "long" && longSignal) {
        console.log("⬆️ Long signal detected");

        if (await closeTrade(perpContractAddress, provider)) {
          console.log("Closed last trade");
          _lastPosition = null;
          _roi = [];

          openPosition.amount = BigInt(0);
          openPosition.price = BigInt(0);
          openPosition.pnl = BigInt(0);
        }

        const result = await openTrade(
          tokenToTrade.address,
          true,
          currentBalance / BigInt(2),
          currentPrice,
          perpContractAddress,
          provider
        );
        _lastPosition = "long";

        openPosition.amount = currentBalance / BigInt(2);
        openPosition.price = currentPrice;

        if (result) {
          console.log("Opened long trade successfully");
          _lastPosition = "long";
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
  const openPrice = +formatDecimals(position.price, 18);
  const currentPrice = +formatDecimals(price, 18);

  const roi =
    lastPosition === "long"
      ? (currentPrice - openPrice) / openPrice
      : (openPrice - currentPrice) / openPrice;

  return roi * leverage * 100;
}

async function getBalance(perpContractAddress: string, provider: Provider) {
  try {
    const balance = await provider.ethers.getBalance(perpContractAddress);

    return balance;
  } catch (error) {
    console.error("Error getBalance", error);
    return null;
  }
}
async function getBNBPrice(
  tokenAddress: string,
  provider: Provider
): Promise<bigint | null> {
  try {
    const oracle = new ethers.Contract(
      "0x1b6F2d3844C6ae7D56ceb3C3643b9060ba28FEb0",
      ["function getPrice(address token) external view returns (uint256)"],
      provider.ethers
    );

    const baseLinePrice = await oracle.getPrice(tokenAddress);

    return toDecimals(baseLinePrice, 10);
  } catch (error) {
    console.error("Error getBaseLinePrice", error);
  }

  return BigInt(0);
}

async function closeTrade(perpContractAddress: string, provider: Provider) {
  try {
    const perp = new ethers.Contract(
      perpContractAddress,
      perpAbi,
      provider.wallet
    );

    const tx = await perp.closeTrade();

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
      amountIn: amount,
      qty: Math.round(+formatDecimals(amount * BigInt(49), 8)),
      price: Math.round(+formatDecimals(price, 8)),
      takeProfit: isLong
        ? Math.round(+formatDecimals(price, 10) * 2)
        : Math.round(+formatDecimals(price, 10) / 2),
    };
    const tx = await perp.openTradeBNB(
      openDataInput.pairBase,
      openDataInput.isLong,
      openDataInput.amountIn,
      openDataInput.qty,
      openDataInput.price,
      openDataInput.takeProfit,
      {
        value: amount,
      }
    );

    await tx.wait();

    return true;
  } catch (error) {
    console.error("Error openMarketTradeBNB", error);
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
