import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { checkArbitrage } from "./utils/check-arbitrage";
import { appConfig } from "./config/app";
import { ethers } from "ethers";

const routersToCheck = [routers.PancakeSwap, routers.BiSwap, routers.MDEX];
const assetsToCheck = [
  {
    token: assets.BTCB,
    amount: 10,
    borrowable: true,
  },
  {
    token: assets.ETH,
    amount: 100,
    borrowable: true,
  },
  {
    token: assets.WBNB,
    amount: 1000,
    borrowable: true,
  },
  {
    token: assets.USDT,
    amount: 100000,
    borrowable: true,
  },
  {
    token: assets.BUSD,
    amount: 100000,
  },
];

const slippageTolerance = 0.5;
const flashLoanFee = 0.0005;

const networkProviderUrl = appConfig.bscRpcUrl;

async function main() {
  // while (true) {

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
            ethers.parseEther(borrowedAmount.toString()),
            networkProviderUrl
          );

          if (opportunity.profit > 0) {
            const finalProfit =
              opportunity.profit -
              ethers.parseEther(borrowedAmount.toString()) *
                BigInt(1 - flashLoanFee);

            if (finalProfit > 0) {
              console.log(
                `✅ Arbitrage opportunity found with profit of ${ethers.formatEther(
                  finalProfit
                )}`
              );
              console.log("Route0: ", opportunity.fromRouter);
              console.log("Route1: ", opportunity.toRouter);
              console.log("Token0: ", opportunity.tokenIn);
              console.log("Token1: ", opportunity.tokenOut);
              console.log("Amount0: ", opportunity.amountIn);
              console.log("Amount1: ", opportunity.amountOut);

              console.log("Performing arbitrage...");
              process.exit(0);
            } else {
              console.log(`❌ Not an arbitrage opportunity\n\n`);
            }
          } else {
            console.log(`❌ Not an arbitrage opportunity\n\n`);
          }
        }
      }
    }
  }

  //await new Promise((resolve) => setTimeout(resolve, 1000));
  //}
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
