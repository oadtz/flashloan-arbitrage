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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
