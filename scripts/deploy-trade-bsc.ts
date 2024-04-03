import { ethers } from "hardhat";

async function main() {
  const WETH_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // WBNB

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
