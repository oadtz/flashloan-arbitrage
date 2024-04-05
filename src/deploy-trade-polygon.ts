import { ethers } from "hardhat";

async function main() {
  const WETH_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"; // WMATIC

  const tradeBot = await ethers.deployContract("TradeBot", [WETH_ADDRESS]);

  await tradeBot.waitForDeployment();

  console.log("TradeBot deployed to:", await tradeBot.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
