import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const token0 = await ethers.deployContract("Token", [
    "Token0",
    "TK0",
    18,
    ethers.parseUnits("1000000000000000000", 18),
  ]);
  await token0.waitForDeployment();
  const token0Address = await token0.getAddress();
  console.log("Token0 deployed to:", token0Address);

  const token1 = await ethers.deployContract("Token", [
    "Token1",
    "TK1",
    18,
    ethers.parseUnits("1000000000000000000", 18),
  ]);
  await token1.waitForDeployment();
  const token1Address = await token1.getAddress();
  console.log("Token1 deployed to:", token1Address);

  const router0 = await ethers.deployContract("Router");
  await router0.waitForDeployment();
  const router0Address = await router0.getAddress();
  console.log("Router0 deployed to:", router0Address);

  const router1 = await ethers.deployContract("Router");
  await router1.waitForDeployment();
  const router1Address = await router1.getAddress();
  console.log("Router1 deployed to:", router1Address);

  // Transfer Token0 and Token1 to the Router0 contract
  await token0.transfer(
    router0Address,
    ethers.parseUnits("10000000000000000", 18)
  );
  await token1.transfer(
    router0Address,
    ethers.parseUnits("10000000000000000", 18)
  );
  // Transfer Token0 and Token1 to the Router1 contract
  await token0.transfer(
    router1Address,
    ethers.parseUnits("10000000000000000", 18)
  );
  await token1.transfer(
    router1Address,
    ethers.parseUnits("10000000000000000", 18)
  );

  await deployer.sendTransaction({
    to: router0Address,
    value: ethers.parseUnits("300", 18),
  });
  await deployer.sendTransaction({
    to: router1Address,
    value: ethers.parseUnits("300", 18),
  });

  const traderBot = await ethers.deployContract("TradeBot");
  await traderBot.waitForDeployment();
  console.log("TradeBot deployed to:", await traderBot.getAddress());

  await deployer.sendTransaction({
    to: await traderBot.getAddress(),
    value: ethers.parseUnits("1", 18),
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
