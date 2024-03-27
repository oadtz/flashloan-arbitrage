import { ethers } from "ethers";
import Web3 from "web3";
import { appConfig } from "./config/app";
import { tokensConfig } from "./config/tokens";
import { routersConfig } from "./config/routers";
import { arbitrageConfig } from "./config/arbitrage";

// Constants
const SLIPPAGE_TOLERANCE = 0.5;
const GAS_LIMIT = 1500000;
const ETH_AMOUNT = 1;

const provider = new ethers.JsonRpcProvider(appConfig.bscRpcUrl);
const web3 = new Web3(new Web3.providers.HttpProvider(appConfig.bscRpcUrl));

const wallet = new ethers.Wallet(appConfig.privateKey, provider);

async function checkArbitrage(
  fromToken: string,
  toToken: string,
  amount: bigint
): Promise<{
  profit: bigint;
  fromRouter?: string;
  toRouter?: string;
  fromRouterAmount?: bigint;
  toRouterAmount?: bigint;
}> {
  const pancakeswapRouter = new ethers.Contract(
    routersConfig.pancakeswap.address,
    routersConfig.pancakeswap.abi,
    provider
  );
  const mdexRouter = new ethers.Contract(
    routersConfig.mdex.address,
    routersConfig.mdex.abi,
    provider
  );

  let [, toTokenOnPancakeswap] = await pancakeswapRouter.getAmountsOut(amount, [
    fromToken,
    toToken,
  ]);
  console.log(
    `${ethers.formatEther(
      amount as ethers.BigNumberish
    )} ETH to BUSD on PancakeSwap: ${ethers.formatEther(toTokenOnPancakeswap)}`
  );
  let [, toTokenOnMdex] = await mdexRouter.getAmountsOut(amount, [
    fromToken,
    toToken,
  ]);
  console.log(
    `${ethers.formatEther(
      amount as ethers.BigNumberish
    )} ETH to BUSD on MDEX: ${ethers.formatEther(toTokenOnMdex)}`
  );

  // Calculate the expected output amount with slippage tolerance
  const slippageTolerance = ethers.parseUnits(
    SLIPPAGE_TOLERANCE.toString(),
    16
  );

  // Calculate the estimated gas cost for the arbitrage transaction
  const gasPrice = await web3.eth.getGasPrice();
  const gasCost = gasPrice * BigInt(GAS_LIMIT);
  const loanFee = (amount * BigInt(0.0005 * 10000)) / BigInt(10000);

  if (toTokenOnPancakeswap > toTokenOnMdex) {
    const receivedTokenOnMdex = (toTokenOnPancakeswap * amount) / toTokenOnMdex;

    const finalTokenAmount =
      (receivedTokenOnMdex * (ethers.WeiPerEther - slippageTolerance)) /
      ethers.WeiPerEther;

    const profit = finalTokenAmount - amount - gasCost - loanFee;

    if (profit > 0) {
      return {
        profit,
        fromRouter: routersConfig.pancakeswap.address,
        toRouter: routersConfig.mdex.address,
        fromRouterAmount: toTokenOnPancakeswap,
        toRouterAmount: toTokenOnMdex,
      };
    }
  } else if (toTokenOnMdex > toTokenOnPancakeswap) {
    const receivedTokenOnPancakewap =
      (toTokenOnMdex * amount) / toTokenOnPancakeswap;

    const finalTokenAmount =
      (receivedTokenOnPancakewap * BigInt(1000 - SLIPPAGE_TOLERANCE * 10)) /
      BigInt(1000);

    const profit = finalTokenAmount - amount - gasCost - loanFee;

    if (profit > 0) {
      return {
        profit,
        fromRouter: routersConfig.mdex.address,
        toRouter: routersConfig.pancakeswap.address,
        fromRouterAmount: toTokenOnMdex,
        toRouterAmount: toTokenOnPancakeswap,
      };
    }
  }

  return {
    profit: BigInt(0),
  };
}

async function performArbitrage(
  fromRouter: string,
  toRouter: string,
  token0: string,
  token1: string,
  amount0: bigint,
  amount1: bigint
) {
  const arbiter = new ethers.Contract(
    arbitrageConfig.bsc.address,
    arbitrageConfig.bsc.abi,
    wallet
  );

  const gasLimit = 10000; //GAS_LIMIT;
  const gasPrice = await web3.eth.getGasPrice();

  const tx = await arbiter.executeArbitrage(
    fromRouter,
    toRouter,
    token0,
    token1,
    amount0,
    amount1,
    {
      gasLimit: gasLimit,
      gasPrice: gasPrice,
    }
  );

  await tx.wait();

  console.log("Arbitrage executed successfully!");
}

async function withdrawFunds() {
  const contract = new ethers.Contract(
    arbitrageConfig.bsc.address,
    arbitrageConfig.bsc.abi,
    wallet
  );

  const tx = await contract.withdraw(tokensConfig.bsc.ETH);

  await tx.wait();

  console.log("Withdrawal transaction confirmed");
}

async function main() {
  const amount = ethers.parseEther(ETH_AMOUNT.toString());
  const fromToken = tokensConfig.bsc.ETH;
  const toToken = tokensConfig.bsc.BUSD;

  //while (true) {
  try {
    const { profit, fromRouter, toRouter, fromRouterAmount, toRouterAmount } =
      await checkArbitrage(fromToken, toToken, amount);

    if (profit > 0) {
      console.log(
        `Arbitrage opportunity found from ${fromRouter}(${ethers.formatEther(
          fromRouterAmount!
        )}) to ${toRouter}(${ethers.formatEther(
          toRouterAmount!
        )}) with profit of ${ethers.formatEther(profit)}`
      );
      await performArbitrage(
        fromRouter!,
        toRouter!,
        fromToken,
        toToken,
        amount,
        fromRouterAmount!
      );
      //await withdrawFunds();
    } else {
      console.log("No arbitrage opportunity found.");
    }
  } catch (error) {
    console.error(error);
    //console.log("Retrying in 60 seconds");
  }

  //     await new Promise((resolve) => setTimeout(resolve, 60000));
  //   }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
