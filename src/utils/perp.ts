import { ethers } from "ethers";
import { Provider, formatDecimals, getProvider } from "./provider";
import { abi as perpAbi } from "../config/perp";
import { routers } from "../config/dex";
import { assets } from "../config/assets";
import { Asset } from "../config/assets";
import logger from "./logger";

export async function run(
  tokenToTrade: Asset,
  networkProviderUrl: string,
  perpContractAddress: string
) {
  console.log("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  // Close current order
  if (await closeTrade(perpContractAddress, provider)) {
    console.log("Closed current trade");
  }

  // Get current BNB price & balance
  const bnbPrice = await getBNBPrice(provider);
  const bnbBalance = await getBalance(provider);

  if (bnbPrice && bnbBalance) {
    console.log("BNB price", formatDecimals(bnbPrice, 18));
    console.log("BNB balance", formatDecimals(bnbBalance, 18));

    const result = await openTrade(
      tokenToTrade.address,
      true,
      bnbBalance / BigInt(2),
      bnbPrice,
      perpContractAddress,
      provider
    );

    console.log(result);
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

async function getBNBPrice(provider: Provider): Promise<bigint | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=USD"
    );

    const bnbPrice = await response.json();

    return BigInt(bnbPrice.binancecoin.usd * 10 ** 18);
  } catch (error) {
    console.error("Error getBNBPrice", error);
    return null;
  }
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
      takeProfit: Math.round(+formatDecimals(price, 10) * 2),
    };
    console.log("openDataInput", openDataInput);
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
