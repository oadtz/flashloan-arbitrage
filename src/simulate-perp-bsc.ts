import { appConfig } from "./config/app";
import { addresses as tradeContractAddresses } from "./config/trade";
import { Asset, assets } from "./config/assets";
import logger from "./utils/logger";
import {
  Provider,
  formatDecimals,
  getProvider,
  toDecimals,
} from "./utils/provider";
import { ethers } from "ethers";
import {
  isShortSignal,
  isLongSignal,
  isROISellSignal,
} from "./utils/trade-analysis";
import fs from "fs";
import { BigUnit } from "bigunit";

const asset = assets.WBNB;

const leverage = 49;
const delay = fs.existsSync("price.csv") ? 0 : 1000;

const networkProviderUrl = appConfig.bscRpcUrl;

const tradeContractAddress = tradeContractAddresses.bsc;
async function run(
  tokenToTrade: Asset,
  networkProviderUrl: string,
  tradeContractAddress: string,
  delay: number
) {
  console.log("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  const _prices: number[] = [];
  const _prices2: number[] = [];
  const _priceData: string[] = getPriceCsv();
  let _roi: number[] = [];
  let _lastPosition: "short" | "long" | null = null;
  let shortCount = 0;
  let longCount = 0;
  let falseShortCount = 0;
  let falseLongCount = 0;

  let epoch = 0;
  let _balance: bigint = BigUnit.from(1, 18).toBigInt();
  const openPosition = {
    price: BigInt(0),
    amount: BigInt(0),
    pnl: BigInt(0),
    falseSignal: false,
  };

  function getPriceCsv() {
    if (fs.existsSync("price.csv")) {
      const data = fs.readFileSync("price.csv", "utf8");
      const lines = data.split("\n");

      return lines;
    }

    return [];
  }

  async function getBNBPrice(
    tradeContractAddress: string,
    provider: Provider
  ): Promise<bigint | null> {
    if (_priceData.length > 0) {
      try {
        const priceData = _priceData[epoch].split(",");

        return BigInt(Number(priceData[4]) * 1e18);
      } catch (error) {
        console.log(error);
        throw new Error(
          "✅ No more data to read from price.csv. Please run the bot again."
        );
      }
    } else {
      try {
        const oracle = new ethers.Contract(
          "0x1b6F2d3844C6ae7D56ceb3C3643b9060ba28FEb0",
          ["function getPrice(address token) external view returns (uint256)"],
          provider.ethers
        );

        const baseLinePrice = await oracle.getPrice(tokenToTrade.address);

        return toDecimals(baseLinePrice, 10);
      } catch (error) {
        console.error("Error getBaseLinePrice", error);
      }

      return BigInt(0);
    }
  }

  function calculateROI(price: bigint, position: any) {
    let adjustedPrice = price;
    // if (_lastPosition === "long")
    //   adjustedPrice = (price * BigInt(1002)) / BigInt(1000);
    // else if (_lastPosition === "short")
    //   adjustedPrice = (price * BigInt(998)) / BigInt(1000);
    const openPrice = +formatDecimals(position.price, 18);
    const currentPrice = +formatDecimals(adjustedPrice, 18);

    const roi =
      _lastPosition === "long"
        ? (currentPrice - openPrice) / openPrice
        : (openPrice - currentPrice) / openPrice;

    return roi * leverage * 100;
  }

  function openTrade(isLong: boolean, amount: bigint, price: bigint) {
    _balance -= amount;
    _lastPosition = isLong ? "long" : "short";

    openPosition.amount = amount;
    // openPosition.price = price;
    openPosition.price = isLong
      ? (price * BigInt(1002)) / BigInt(1000)
      : (price * BigInt(998)) / BigInt(1000);

    return true;
  }

  function closeTrade() {
    const fee =
      (openPosition.amount * BigInt(leverage) * BigInt(2)) / BigInt(1000);

    openPosition.falseSignal = openPosition.pnl <= 0;

    _balance += openPosition.pnl - fee > 0 ? openPosition.pnl - fee : BigInt(0);

    if (_roi[_roi.length - 1] < 0) {
      if (_lastPosition === "long") falseLongCount++;
      else if (_lastPosition === "short") falseShortCount++;
    }

    _lastPosition = null;
    _roi = [];

    openPosition.amount = BigInt(0);
    openPosition.price = BigInt(0);
    openPosition.pnl = BigInt(0);

    console.log(`Updated balance: ${formatDecimals(_balance, 18)}`);

    return true;
  }

  while (true) {
    // Get current BNB price & balance
    const currentPrice = await getBNBPrice(tradeContractAddress, provider);

    console.clear();
    console.log(`Epoch: ${epoch}`);
    if (currentPrice && _balance) {
      console.log("Current price", formatDecimals(currentPrice, 18));
      console.log("Current balance", formatDecimals(_balance, 18));

      if (_prices.length > 500) _prices.shift();
      _prices.push(+formatDecimals(currentPrice, 18));
      if (_prices2.length > 500) _prices2.shift();
      if (epoch % 12 === 0) _prices2.push(+formatDecimals(currentPrice, 18));

      const { short: shortSignal, indicators } = isShortSignal(_prices, _prices2);
      const { long: longSignal } = isLongSignal(_prices, _prices2);

      if (openPosition.amount > 0) {
        console.log(`Current position: ${_lastPosition}`);
        console.log(`Entry price: ${formatDecimals(openPosition.price, 18)}`);
        const roi = calculateROI(currentPrice, openPosition);
        console.log(`ROI: ${roi}%`);
        openPosition.pnl = toDecimals(
          Math.round(+formatDecimals(openPosition.amount, 0) * (1 + roi / 100)),
          0
        );
        console.log(`PNL: ${formatDecimals(openPosition.pnl, 18)}`);

        if (_roi.length > 1000) _roi.shift();

        _roi.push(roi);

        if (
          (isROISellSignal(_roi) && longSignal && _lastPosition !== "long") ||
          (isROISellSignal(_roi) && shortSignal && _lastPosition !== "short") ||
          (isROISellSignal(_roi) && !shortSignal && !longSignal)
          // isROISellSignal(_roi) ||
          // (longSignal && _lastPosition !== "long") ||
          // (shortSignal && _lastPosition !== "short")
        ) {
          console.log("👁️ Stop loss/Take profit/Reversal signal detected");
          closeTrade();
          console.log(`Closed last trade\n\n`);
          continue;
        }
      }

      console.log(`BBand Signal: ${indicators.bbandSignal}`);
      console.log(`Long Term Signal: ${indicators.longTermSignal}`);
      console.log(`Short Term Signal: ${indicators.shortTermSignal}`);

      console.log(`Trend BBand Signal: ${indicators.bbandTrendSignal}`);
      console.log(`Trend Long Term Signal: ${indicators.longTermTrend}`);
      console.log(`Trend Short Term Signal: ${indicators.shortTermTrend}`);

      console.log(`Short Signal: ${shortSignal}`);
      console.log(`Long Signal: ${longSignal}`);

      logger.warn({
        price0: 0,
        price1: 0,
        price2: +formatDecimals(currentPrice, 18),
        price3: 0,
        sell: _lastPosition !== "short" && shortSignal,
        buy: _lastPosition !== "long" && longSignal,
        falseSignal: openPosition.falseSignal,
        ...indicators,
      });
      logger.flush();

      if (_lastPosition === null && shortSignal) {
        console.log("⬇️ Short signal detected");

        const result = openTrade(false, _balance / BigInt(2), currentPrice);

        if (result) {
          console.log(`Opened short trade#${++shortCount}\n\n`);
          _lastPosition = "short";
        }
      } else if (_lastPosition === null && longSignal) {
        console.log("⬆️ Long signal detected");

        const result = openTrade(true, _balance / BigInt(2), currentPrice);

        if (result) {
          console.log(`Opened long trade#${++longCount}\n\n`);
          _lastPosition = "long";
        }
      } else {
        console.log("❌ No signal detected\n\n");
      }
    }

    epoch++;
    console.log(`Short count: ${shortCount}`);
    console.log(`False short count: ${falseShortCount}`);
    console.log(`Long count: ${longCount}`);
    console.log(`False long count: ${falseLongCount}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

run(asset, networkProviderUrl, tradeContractAddress, delay).catch((error) => {
  console.error(error);
  process.exit(1);
});
