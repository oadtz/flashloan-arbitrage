import { ethers } from "ethers";
import { checkArbitrage } from "./check-arbitrage";
import { Provider, getProvider, toDecimals } from "./provider";
import {
  addresses as arbitrageAddresses,
  abi as arbitrageAbi,
} from "../config/arbitrage";

export async function run(
  routersToCheck: any[],
  assetsToCheck: any[],
  slippageTolerance: number,
  flashLoanFee: number,
  networkProviderUrl: string,
  delay: number
) {
  console.log("🚀 Starting bot...");

  const provider = getProvider(networkProviderUrl);

  while (true) {
    for (const asset1 of assetsToCheck) {
      for (const asset2 of assetsToCheck) {
        if (asset1.token === asset2.token || !asset1.borrowable) {
          continue;
        }

        for (const router1 of routersToCheck) {
          for (const router2 of routersToCheck) {
            if (router1 === router2) {
              continue;
            }

            const token1 = asset1.token;
            const token2 = asset2.token;
            const borrowedAmount = asset1.amount;

            const opportunity = await checkArbitrage(
              router1,
              router2,
              token1,
              token2,
              await toDecimals(token1, borrowedAmount, provider),
              slippageTolerance,
              provider
            );

            console.log("Route0: ", opportunity.fromRouter);
            console.log("Route1: ", opportunity.toRouter);
            console.log("Token0: ", opportunity.tokenIn);
            console.log("Token1: ", opportunity.tokenOut);
            console.log("Amount0: ", opportunity.amountIn.toString());
            console.log("Amount1: ", opportunity.amountOut?.toString());
            console.log(
              "Fee: ",
              (
                (ethers.parseEther(borrowedAmount.toString()) *
                  BigInt(Math.floor(1.0005 * 10000))) /
                BigInt(10000)
              ).toString()
            );

            if (opportunity.profit > 0) {
              const finalProfit =
                opportunity.profit -
                ethers.parseEther(borrowedAmount.toString()) *
                  (BigInt(Math.floor(1.0005 * 10000)) / BigInt(10000));

              if (finalProfit >= 0) {
                console.log(`🎉 Arbitrage opportunity found`);

                console.log("Performing arbitrage...");

                await perform(
                  opportunity.fromRouter,
                  opportunity.toRouter,
                  opportunity.tokenIn,
                  opportunity.tokenOut,
                  opportunity.amountIn,
                  opportunity.amountOut!,
                  provider
                );

                console.log("🌛 Arbitrage executed successfully!");

                console.log("Withdrawing funds...");

                await withdrawFunds(opportunity.tokenIn, provider);

                console.log("Withdrawal transaction confirmed");
                //continue;
                process.exit(0);
              }
            }

            console.log(`❌ Not an arbitrage opportunity\n\n`);

            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }
  }
}

async function perform(
  router0: string,
  router1: string,
  token0: string,
  token1: string,
  amountToFlashLoan: bigint,
  amountToCheck: bigint,
  provider: Provider
) {
  const arbiter = new ethers.Contract(
    arbitrageAddresses.bsc,
    arbitrageAbi,
    provider.wallet
  );

  const tx = await arbiter.executeArbitrage(
    router0,
    router1,
    token0,
    token1,
    amountToFlashLoan,
    amountToCheck,
    {
      gasLimit: 3000000,
    }
  );
  await tx.wait();

  return true;
}

async function withdrawFunds(assetToWithdraw: string, provider: Provider) {
  const contract = new ethers.Contract(
    arbitrageAddresses.bsc,
    arbitrageAbi,
    provider.wallet
  );

  const tx = await contract.withdraw(assetToWithdraw);

  await tx.wait();

  return true;
}
