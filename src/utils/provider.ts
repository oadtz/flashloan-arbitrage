import { ethers as Ethers } from "ethers";
import Web3 from "web3";
import { appConfig } from "../config/app";
import { abi as routerAbi } from "../config/dex";
import { abi as assetAbi } from "../config/assets";

export type Provider = {
  ethers: Ethers.JsonRpcProvider;
  web3: Web3;
  wallet: Ethers.Wallet;
};

export function getProvider(providerUrl: string): Provider {
  const ethers = new Ethers.JsonRpcProvider(providerUrl);
  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
  const wallet = new Ethers.Wallet(appConfig.privateKey, ethers);

  return {
    ethers,
    web3,
    wallet,
  };
}

export async function getContract(
  address: string,
  abi: any,
  provider: Provider
): Promise<Ethers.Contract> {
  return new Ethers.Contract(address, abi, provider.ethers);
}

export async function getGasPrice(provider: Provider): Promise<bigint> {
  return await provider.web3.eth.getGasPrice();
}

export async function toDecimals(
  asset: string,
  amount: number,
  provider: Provider
): Promise<bigint> {
  const assetContract = new Ethers.Contract(asset, assetAbi, provider.ethers);

  const decimals: number = await assetContract.decimals();

  return Ethers.parseUnits(amount.toString(), decimals);
}

export async function estimateSwap(
  router: string,
  assetIn: string,
  assetOut: string,
  amountIn: bigint,
  provider: Provider
): Promise<{
  amountOut: bigint;
  gas: bigint;
}> {
  const routerContract = new Ethers.Contract(
    router,
    routerAbi,
    provider.ethers
  );

  const [, amountOut] = await routerContract.getAmountsOut(amountIn, [
    assetIn,
    assetOut,
  ]);
  const gas = await routerContract.getAmountsOut.estimateGas(amountIn, [
    assetIn,
    assetOut,
  ]);

  return {
    amountOut,
    gas,
  };
}
