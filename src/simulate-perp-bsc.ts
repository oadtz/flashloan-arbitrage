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
import { isShortSignal, isLongSignal } from "./utils/trade-analysis";
import { routers } from "./config/dex";
import { abi as tradeAbi } from "./config/trade";
import fs from "fs";

const asset = assets.WBNB;

const leverage = 50;
const delay = 0;

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
  let _lastPosition: "short" | "long" | null = null;

  let epoch = 0;
  let _balance: bigint = toDecimals(1, 18);
  const openPosition = {
    price: BigInt(0),
    amount: BigInt(0),
    pnl: BigInt(0),
  };

  async function getBNBPrice(
    tradeContractAddress: string,
    provider: Provider
  ): Promise<bigint | null> {
    if (fs.existsSync("price.csv")) {
      const data = fs.readFileSync("price.csv", "utf8");
      const lines = data.split("\n");

      try {
        const priceData = lines[epoch].split(",");

        return BigInt(Number(priceData[4]) * 1e18);
      } catch (error) {
        throw new Error(
          "✅ No more data to read from price.csv. Please run the bot again."
        );
      }
    } else {
      try {
        const trader = new ethers.Contract(
          tradeContractAddress,
          tradeAbi,
          provider.ethers
        );

        const baseLinePrice = await trader.getBaseLinePrice(
          routers.PancakeSwap,
          assets.BUSD.address
        );

        return baseLinePrice;
      } catch (error) {
        console.error("Error getBaseLinePrice", error);
      }

      return BigInt(0);
    }
  }

  function closeTrade() {
    _balance += openPosition.pnl;

    openPosition.amount = BigInt(0);
    openPosition.price = BigInt(0);
    openPosition.pnl = BigInt(0);

    console.log(`Updated balance: ${formatDecimals(_balance, 18)}`);

    return true;
  }

  function calculateROI(price: bigint, position: any) {
    const openPrice = +formatDecimals(position.price, 18);
    const currentPrice = +formatDecimals(price, 18);

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
    openPosition.price = price;

    return true;
  }

  while (true) {
    // Get current BNB price & balance
    const currentPrice = await getBNBPrice(tradeContractAddress, provider);

    console.log(`Epoch: ${epoch}`);
    if (currentPrice && _balance) {
      console.log("Current price", formatDecimals(currentPrice, 18));
      console.log("Current balance", formatDecimals(_balance, 18));

      if (openPosition.amount > 0) {
        console.log(`Last position: ${_lastPosition}`);
        console.log(`Open position: ${formatDecimals(openPosition.price, 18)}`);
        const roi = calculateROI(currentPrice, openPosition);
        console.log(`ROI: ${roi}%`);
        openPosition.pnl = toDecimals(
          Math.round(+formatDecimals(openPosition.amount, 0) * (1 + roi / 100)),
          0
        );
        console.log(`PNL: ${formatDecimals(openPosition.pnl, 18)}`);

        if (roi <= -90) {
          console.log("Liquidated");
          openPosition.amount = BigInt(0);
          openPosition.price = BigInt(0);
          openPosition.pnl = BigInt(0);
        } else if (roi <= -50) {
          console.log("Stop loss");
          closeTrade();
        }
      }

      if (_prices.length > 500) _prices.shift();

      _prices.push(+formatDecimals(currentPrice, 18));

      const { short: shortSignal, indicators } = isShortSignal(_prices);
      const { long: longSignal } = isLongSignal(_prices);

      console.log(`MACD Signal: ${indicators.macdSignal}`);
      console.log(`MACD: ${indicators.macd}`);
      console.log(`Stochastic D: ${indicators.stochasticD}`);
      console.log(`Stochastic K: ${indicators.stochasticK}`);
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

        if (closeTrade()) {
          console.log("Closed last trade");
        }

        const result = openTrade(false, _balance / BigInt(2), currentPrice);

        if (result) {
          console.log("Opened short trade successfully\n\n");
          _lastPosition = "short";
        }
      } else if (_lastPosition !== "long" && longSignal) {
        // console.log("⬆️ Long signal detected");

        if (closeTrade()) {
          console.log("Closed last trade");
        }

        // const result = openTrade(true, _balance / BigInt(2), currentPrice);

        // if (result) {
        //   console.log("Opened long trade successfully\n\n");
        _lastPosition = "long";
        // }
      } else {
        console.log("❌ No signal detected\n\n");
      }
    }

    epoch++;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

run(asset, networkProviderUrl, tradeContractAddress, delay).catch((error) => {
  console.error(error);
  process.exit(1);
});
