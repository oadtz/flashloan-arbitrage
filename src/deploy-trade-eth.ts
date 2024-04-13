import { ethers } from "hardhat";

async function main() {
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH

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
