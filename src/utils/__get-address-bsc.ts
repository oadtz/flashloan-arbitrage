import { ethers } from "ethers";
import { appConfig } from "./config/app";

const provider = new ethers.providers.JsonRpcProvider(appConfig.bscRpcUrl);
const poolAddressesProviderContract = new ethers.Contract(
  "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7	", // Uniswap
  [
    {
      constant: true,
      inputs: [],
      name: "getPool",
      outputs: [{ name: "", type: "address" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
  ], // ABI for the PoolAddressesProvider
  provider
);

(async () => {
  const lendingPoolAddress = await poolAddressesProviderContract.getPool();
  console.log("Aave V3 Lending Pool Address:", lendingPoolAddress);
})();
