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
import { isBuySignal, isSellSignal } from "./utils/trade-analysis";
import { routers } from "./config/dex";
import { abi as tradeAbi } from "./config/trade";
import { BigUnit } from "bigunit";

const asset = assets.WBNB;

const delay = 10000;

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

  function closeTrade() {
    _balance += openPosition.pnl;

    return true;
  }

  function calculateROI(price: bigint, position: any) {
    const openPrice = +formatDecimals(position.price, 18);
    const currentPrice = +formatDecimals(price, 18);

    const roi = position.isLong
      ? (currentPrice - openPrice) / openPrice
      : (openPrice - currentPrice) / openPrice;

    return roi * 49 * 100;
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
    const bnbPrice = await getBNBPrice(tradeContractAddress, provider);

    console.log(`Epoch: ${epoch}`);
    if (bnbPrice && _balance) {
      console.log("Current price", formatDecimals(bnbPrice, 18));
      console.log("Current balance", formatDecimals(_balance, 18));

      if (openPosition.amount > 0) {
        console.log(`Last position: ${_lastPosition}`);
        console.log(`Open position: ${formatDecimals(openPosition.price, 18)}`);
        const roi = calculateROI(bnbPrice, openPosition);
        console.log(`ROI: ${roi}%`);
        openPosition.pnl = toDecimals(
          Math.round(+formatDecimals(openPosition.amount, 0) * (1 + roi / 100)),
          0
        );
        console.log(`PNL: ${formatDecimals(openPosition.pnl, 18)}`);

        if (roi <= -100) {
          console.log("Liquidated");
          openPosition.amount = BigInt(0);
          openPosition.price = BigInt(0);
          openPosition.pnl = BigInt(0);
        }
      }

      if (_prices.length > 500) _prices.shift();

      _prices.push(+formatDecimals(bnbPrice, 18));

      const { sell: sellSignal, indicators } = isSellSignal(_prices);
      const { buy: buySignal } = isBuySignal(_prices);

      console.log(`MACD Signal: ${indicators.macdSignal}`);
      console.log(`MACD: ${indicators.macd}`);
      console.log(`Stochastic D: ${indicators.stochasticD}`);
      console.log(`Stochastic K: ${indicators.stochasticK}`);
      console.log(`Short Signal: ${sellSignal}`);
      console.log(`Long Signal: ${buySignal}`);

      if (_lastPosition !== "long" && buySignal) {
        console.log("⬆️ Long signal detected");

        // Close current order
        if (closeTrade()) {
          console.log("Closed last trade");
        }

        const result = openTrade(true, _balance / BigInt(2), bnbPrice);

        if (result) {
          console.log("Opened long trade successfully\n\n");
          _lastPosition = "long";
        }
      } else if (_lastPosition !== "short" && sellSignal) {
        console.log("⬇️ Short signal detected");

        // Close current order
        if (closeTrade()) {
          console.log("Closed last trade");
        }

        const result = openTrade(false, _balance / BigInt(2), bnbPrice);

        if (result) {
          console.log("Opened short trade successfully\n\n");
          _lastPosition = "short";
        }
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
