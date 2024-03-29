import { ethers } from "ethers";
import { checkArbitrage } from "./check-arbitrage";
import { Provider, getProvider, toDecimals } from "./provider";
import { abi as arbitrageAbi } from "../config/arbitrage";

export async function run(
  routersToCheck: any[],
  assetsToCheck: any[],
  slippageTolerance: number,
  flashLoanFee: number,
  networkProviderUrl: string,
  arbitrageContractAddress: string,
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
              await toDecimals(borrowedAmount, token1, provider),
              slippageTolerance,
              provider
            );

            console.log("Route0: ", opportunity.fromRouter);
            console.log("Route1: ", opportunity.toRouter);
            console.log("Token0: ", opportunity.tokenIn);
            console.log("Token1: ", opportunity.tokenOut);
            console.log("Amount0: ", opportunity.amountIn.toString());
            console.log("Amount1: ", opportunity.amountOut?.toString());

            console.log(`Opportunity: ${opportunity.profit.toString()}`);
            if (opportunity.profit > 0) {
              const fee =
                ((await toDecimals(borrowedAmount, token1, provider)) *
                  BigInt(Math.floor(0.0005 * 10000))) /
                BigInt(10000);
              console.log(`Cost: ${fee.toString()}`);

              const finalProfit = opportunity.profit - fee;

              console.log(`Final profit: ${finalProfit.toString()}`);

              if (finalProfit >= 0) {
                console.log(`🎉 Arbitrage opportunity found`);

                console.log("Performing arbitrage...");

                if (
                  await perform(
                    opportunity.fromRouter,
                    opportunity.toRouter,
                    opportunity.tokenIn,
                    opportunity.tokenOut,
                    opportunity.amountIn,
                    provider,
                    arbitrageContractAddress
                  )
                ) {
                  console.log("Withdrawing funds...");

                  await withdrawFunds(
                    opportunity.tokenIn,
                    provider,
                    arbitrageContractAddress
                  );
                }

                continue;
                //process.exit(0);
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
  provider: Provider,
  arbitrageContractAddress: string
) {
  if (!arbitrageContractAddress) return false; // Skip arbitrage if no contract address is provided

  try {
    const arbiter = new ethers.Contract(
      arbitrageContractAddress,
      arbitrageAbi,
      provider.wallet
    );

    const tx = await arbiter.executeArbitrage(
      router0,
      router1,
      token0,
      token1,
      amountToFlashLoan,
      {
        gasLimit: 3000000,
      }
    );
    await tx.wait();
    console.log("🌛 Arbitrage executed successfully!");

    return true;
  } catch (error) {
    console.error("Error performing arbitrage");
    throw error;
  }
}

async function withdrawFunds(
  assetToWithdraw: string,
  provider: Provider,
  arbitrageContractAddress: string
) {
  if (!arbitrageContractAddress) return false; // Skip withdrawal if no contract address is provided

  try {
    const contract = new ethers.Contract(
      arbitrageContractAddress,
      arbitrageAbi,
      provider.wallet
    );

    const tx = await contract.withdraw(assetToWithdraw, {
      gasLimit: 3000000,
    });

    await tx.wait();

    console.log("💰💰 Withdrawal transaction confirmed");
    return true;
  } catch (error) {
    console.error("Error withdrawing funds");
    throw error;
  }
}
