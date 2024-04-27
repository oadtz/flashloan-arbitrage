import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const market = await ethers.deployContract("Future");
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("Future deployed to:", marketAddress);

  const perpBot = await ethers.deployContract("PerpetualBot", [marketAddress]);
  await perpBot.waitForDeployment();
  console.log("PerpetualBot deployed to:", await perpBot.getAddress());

  await deployer.sendTransaction({
    to: await perpBot.getAddress(),
    value: ethers.parseUnits("1", 18),
  });

  const weth = await ethers.deployContract("Token", [
    "Wrapped Ether",
    "WETH",
    18,
    ethers.parseUnits("200000", 18),
  ]);
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("WETH deployed to:", wethAddress);

  const token0 = await ethers.deployContract("Token", [
    "Token0",
    "TK0",
    18,
    ethers.parseUnits("1000000000000000000", 18),
  ]);
  await token0.waitForDeployment();
  const token0Address = await token0.getAddress();
  console.log("Token0 deployed to:", token0Address);

  const traderBot = await ethers.deployContract("TradeBot", [wethAddress]);
  await traderBot.waitForDeployment();
  console.log("TradeBot deployed to:", await traderBot.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
