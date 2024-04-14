import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/trade";
import { addresses as tradeContractAddresses } from "./config/trade";

const routersToCheck = [routers.PEPE];
const assetsToCheck = [assets.UniSwap];

const slippageTolerance = 0.5;
const gasLimit = 3000000; // 25000000;
const delay = 60000;

const networkProviderUrl = appConfig.ethereumRpcUrl;

const tradeContractAddress = tradeContractAddresses.ethereum;

run(
  routersToCheck,
  assetsToCheck,
  slippageTolerance,
  gasLimit,
  networkProviderUrl,
  tradeContractAddress,
  true,
  delay
).catch((error) => {
  console.error(error);
  process.exit(1);
});
