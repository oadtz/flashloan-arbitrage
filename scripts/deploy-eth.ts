import { ethers } from "hardhat";

async function main() {
  //const AAVE_ADDRESS_PROVIDER = "0x0496275d34753A48320CA58103d5220d394FF77F"; // Sepolia testnet
  const AAVE_ADDRESS_PROVIDER = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"; // Eth mainnet

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
