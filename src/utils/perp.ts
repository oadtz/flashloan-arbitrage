import { ethers } from "ethers";
import { Provider, formatDecimals, getProvider } from "./provider";
import { abi as perpAbi } from "../config/perp";
import { abi as tradeAbi } from "../config/trade";
import { routers } from "../config/dex";
import { assets } from "../config/assets";
import { Asset } from "../config/assets";
import logger from "./logger";
import { isBuySignal, isSellSignal } from "./trade-analysis";

export async function run(
  tokenToTrade: Asset,
  networkProviderUrl: string,
  perpContractAddress: string,
  tradeContractAddress: string,
  delay: number
) {
  console.log("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  const _prices: number[] = [];
  let _lastPosition: "short" | "long" | null = null;

  while (true) {
    // Get current BNB price & balance
    const bnbPrice = await getBNBPrice(tradeContractAddress, provider);
    const bnbBalance = await getBalance(provider);

    if (bnbPrice && bnbBalance) {
      console.log("BNB price", formatDecimals(bnbPrice, 18));
      console.log("BNB balance", formatDecimals(bnbBalance, 18));

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
        console.log("Long signal detected");

        // Close current order
        if (await closeTrade(perpContractAddress, provider)) {
          console.log("Closed last trade");
        }

        const result = await openTrade(
          tokenToTrade.address,
          true,
          bnbBalance / BigInt(2),
          bnbPrice,
          perpContractAddress,
          provider
        );

        if (result) {
          console.log("Opened long trade successfully\n\n");
          _lastPosition = "long";
        }
      } else if (_lastPosition !== "short" && sellSignal) {
        console.log("Short signal detected");

        // Close current order
        if (await closeTrade(perpContractAddress, provider)) {
          console.log("Closed last trade");
        }

        const result = await openTrade(
          tokenToTrade.address,
          false,
          bnbBalance / BigInt(2),
          bnbPrice,
          perpContractAddress,
          provider
        );

        if (result) {
          console.log("Opened short trade successfully\n\n");
          _lastPosition = "short";
        }
      } else {
        console.log("No signal detected\n\n");
      }
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

async function getBalance(provider: Provider) {
  try {
    const balance = await provider.ethers.getBalance(provider.wallet.address);

    return balance;
  } catch (error) {
    console.error("Error getBalance", error);
    return null;
  }
}

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
