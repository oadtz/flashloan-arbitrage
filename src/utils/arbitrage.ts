import { ethers } from "ethers";
import { checkArbitrage } from "./check-arbitrage";
import { getProvider, toDecimals } from "./provider";

export async function run(
  routersToCheck: any[],
  assetsToCheck: any[],
  slippageTolerance: number,
  flashLoanFee: number,
  networkProviderUrl: string
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

                //continue;
                process.exit(0);
              }
            }

            console.log(`❌ Not an arbitrage opportunity\n\n`);

            await new Promise((resolve) => setTimeout(resolve, 10000));
          }
        }
      }
    }
  }
}
