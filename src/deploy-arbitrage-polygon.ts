import { ethers } from "hardhat";

async function main() {
  const AAVE_ADDRESS_PROVIDER = "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb"; // Polygon mainnet

  const arbitrageBot = await ethers.deployContract("ArbitrageBot", [
    AAVE_ADDRESS_PROVIDER,
  ]);

  await arbitrageBot.waitForDeployment();

  console.log("ArbitrageBot deployed to:", await arbitrageBot.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
