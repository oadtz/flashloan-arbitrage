import { ethers } from "hardhat";

async function main() {
  const tradeBot = await ethers.deployContract("TradeBot");

  await tradeBot.waitForDeployment();

  console.log("TradeBot deployed to:", await tradeBot.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
