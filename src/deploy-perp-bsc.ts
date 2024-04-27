import { ethers } from "hardhat";

async function main() {
  const MARKET_ADDRESS = "0x1b6F2d3844C6ae7D56ceb3C3643b9060ba28FEb0"; // PancakeSwap

  const perpBot = await ethers.deployContract("PerpetualBot", [MARKET_ADDRESS]);

  await perpBot.waitForDeployment();

  console.log("PerpetualBot deployed to:", await perpBot.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
