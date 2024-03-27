import { ethers } from "hardhat";

async function main() {
  const AAVE_ADDRESS_PROVIDER = "0x6807dc923806fE8Fd134338EABCA509979a7e0cB"; // Aave v3 pool
  const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const MDEX_ROUTER = "0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8";

  const ArbitrageBot = await ethers.getContractFactory("ArbitrageBot");
  const arbitrageBot = await ArbitrageBot.deploy(
    "0x0562453c3DAFBB5e625483af58f4E6D668c44e19",
    //AAVE_ADDRESS_PROVIDER,
    // PANCAKESWAP_ROUTER,
    // MDEX_ROUTER,
    { gasLimit: 8000000 }
  );

  await arbitrageBot.waitForDeployment();

  console.log("ArbitrageBot deployed to:", arbitrageBot.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
