import { ethers } from "ethers";
import Web3 from "web3";
import { appConfig } from "./config/app";
import { tokensConfig } from "./config/tokens";
import { routersConfig } from "./config/routers";
import { arbitrageConfig } from "./config/arbitrage";

// Constants
const SLIPPAGE_TOLERANCE = 0.5;
const ETH_AMOUNT = 1000000;

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
  const gasPrice = await web3.eth.getGasPrice();
  const router0 = new ethers.Contract(
    routersConfig.pancakeswap.address,
    routersConfig.pancakeswap.abi,
    provider
  );
  const router1 = new ethers.Contract(
    routersConfig.mdex.address,
    routersConfig.mdex.abi,
    provider
  );

  let [, outTokenFromRouter0] = await router0.getAmountsOut(amount, [
    fromToken,
    toToken,
  ]);
  const gas0 = await router0.getAmountsOut.estimateGas(amount, [
    fromToken,
    toToken,
  ]);
  console.log(
    `${ethers.formatEther(
      amount
    )} token0 to token1 on router0: ${ethers.formatEther(
      outTokenFromRouter0
    )} with gas: ${ethers.formatEther(gas0 * gasPrice)}`
  );
  let [, outTokenFromRouter1] = await router1.getAmountsOut(amount, [
    fromToken,
    toToken,
  ]);
  const gas1 = await router1.getAmountsOut.estimateGas(amount, [
    fromToken,
    toToken,
  ]);
  console.log(
    `${ethers.formatEther(
      amount
    )} token0 to token1 on router1: ${ethers.formatEther(
      outTokenFromRouter1
    )} with gas: ${ethers.formatEther(gas1 * gasPrice)}`
  );

  // Calculate the expected output amount with slippage tolerance
  const slippageTolerance = ethers.parseUnits(
    SLIPPAGE_TOLERANCE.toString(),
    16
  );
  const loanFee = (amount * BigInt(0.0005 * 10000)) / BigInt(10000);
  console.log("Loan fee:", ethers.formatEther(loanFee));

  if (outTokenFromRouter0 > outTokenFromRouter1) {
    const receivedTokenFromRouter1 =
      (outTokenFromRouter0 * amount) / outTokenFromRouter1;

    const finalTokenAmount =
      (receivedTokenFromRouter1 * (ethers.WeiPerEther - slippageTolerance)) /
      ethers.WeiPerEther;

    const gasCost = gas0 * gasPrice;
    const profit = finalTokenAmount - amount - gasCost - loanFee;

    if (profit > 0) {
      return {
        profit,
        fromRouter: routersConfig.pancakeswap.address,
        toRouter: routersConfig.mdex.address,
        fromRouterAmount: outTokenFromRouter0,
        toRouterAmount: outTokenFromRouter1,
      };
    }
  } else if (outTokenFromRouter1 > outTokenFromRouter0) {
    const receivedTokenFromRouter0 =
      (outTokenFromRouter1 * amount) / outTokenFromRouter0;

    const finalTokenAmount =
      (receivedTokenFromRouter0 * BigInt(1000 - SLIPPAGE_TOLERANCE * 10)) /
      BigInt(1000);

    const gasCost = gas1 * gasPrice;
    const profit = finalTokenAmount - amount - gasCost - loanFee;

    if (profit > 0) {
      return {
        profit,
        fromRouter: routersConfig.mdex.address,
        toRouter: routersConfig.pancakeswap.address,
        fromRouterAmount: outTokenFromRouter1,
        toRouterAmount: outTokenFromRouter0,
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
  const gasPrice = await web3.eth.getGasPrice();
  const arbiter = new ethers.Contract(
    arbitrageConfig.bsc.address,
    arbitrageConfig.bsc.abi,
    wallet
  );

  const gasLimit = 3000000;

  console.log("----------------PARAMETERS-------------------");
  console.log("Contract address:", arbitrageConfig.bsc.address);
  console.log("From router:", fromRouter);
  console.log("To router:", toRouter);
  console.log("Token0:", token0);
  console.log("Token1:", token1);
  console.log("Amount0:", amount0.toString());
  console.log("Amount1:", amount1.toString());
  console.log("---------------------------------------------");

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

  const tx = await contract.withdraw(tokensConfig.bsc.USDT);

  await tx.wait();

  console.log("Withdrawal transaction confirmed");
}

async function main() {
  const gasPrice = await web3.eth.getGasPrice();
  const amount = ethers.parseEther(ETH_AMOUNT.toString());
  const fromToken = tokensConfig.bsc.USDT;
  const toToken = tokensConfig.bsc.WBNB;

  //while (true) {
  try {
    const { profit, fromRouter, toRouter, fromRouterAmount, toRouterAmount } =
      await checkArbitrage(fromToken, toToken, amount);

    if (profit > 0) {
      console.log(
        `Arbitrage opportunity found with profit of ${ethers.formatEther(
          profit
        )}`
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
