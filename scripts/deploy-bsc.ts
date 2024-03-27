import { ethers } from "hardhat";

async function main() {
  //const AAVE_ADDRESS_PROVIDER = "0x0496275d34753A48320CA58103d5220d394FF77F"; // Sepolia testnet
  const AAVE_ADDRESS_PROVIDER = "0xff75B6da14FfbbfD355Daf7a2731456b3562Ba6D"; // BSC mainnet
  //const ROUTER0 = "0x86dcd3293C53Cf8EFd7303B57beb2a3F671dDE98"; // UniSwap Sepolia testnet
  const ROUTER0 = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap BSC mainnet
  const ROUTER1 = "0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8"; // MDEX BSC Mainnet

  const arbitrageBot = await ethers.deployContract("ArbitrageBot", [
    AAVE_ADDRESS_PROVIDER,
    ROUTER0,
    ROUTER1,
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
