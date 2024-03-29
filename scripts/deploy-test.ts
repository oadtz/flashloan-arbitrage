import { ethers } from "hardhat";

async function main() {
  const AAVE_ADDRESS_PROVIDER = "0x0496275d34753A48320CA58103d5220d394FF77F"; // Sepolia testnet
  const [deployer] = await ethers.getSigners();

  const token0 = await ethers.deployContract("Token", [
    "Token0",
    "TK0",
    18,
    ethers.parseUnits("1000000000000", 18),
  ]);
  await token0.waitForDeployment();
  const token0Address = await token0.getAddress();
  console.log("Token0 deployed to:", token0Address);

  const token1 = await ethers.deployContract("Token", [
    "Token1",
    "TK1",
    18,
    ethers.parseUnits("1000000000000", 18),
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

  const pool = await ethers.deployContract("Pool");
  await pool.waitForDeployment();
  const poolAddress = pool.target;
  console.log("Pool deployed to:", poolAddress);
  // const poolAddress = AAVE_ADDRESS_PROVIDER;

  // Transfer Token0 and Token1 to the Pool contract
  await token0.transfer(poolAddress, ethers.parseUnits("500000000000", 18));
  await token1.transfer(poolAddress, ethers.parseUnits("500000000000", 18));

  // Transfer Token0 and Token1 to the Router0 contract
  await token0.transfer(router0Address, ethers.parseUnits("10000000000", 18));
  await token1.transfer(router0Address, ethers.parseUnits("10000000000", 18));

  const arbitrageBot = await ethers.deployContract("ArbitrageBot", [
    poolAddress,
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
