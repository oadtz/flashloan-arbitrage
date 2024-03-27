import { ethers } from "hardhat";

async function main() {
  //const AAVE_ADDRESS_PROVIDER = "0x0496275d34753A48320CA58103d5220d394FF77F"; // Sepolia testnet
  const AAVE_ADDRESS_PROVIDER = "0xff75B6da14FfbbfD355Daf7a2731456b3562Ba6D"; // BSC mainnet
  const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const MDEX_ROUTER = "0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8";

  const arbitrageBot = await ethers.deployContract("ArbitrageBot", [
    AAVE_ADDRESS_PROVIDER,
    PANCAKESWAP_ROUTER,
    MDEX_ROUTER,
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
