import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/trade";
import { addresses as tradeContractAddresses } from "./config/trade";

const routersToCheck = [routers.QuickSwap];
const assetsToCheck = [assets.pUSDT];

const slippageTolerance = 0.5;
const gasLimit = 3000000; // 25000000;
const delay = 3600000;

const networkProviderUrl = appConfig.polygonRpcUrl;

const tradeContractAddress = tradeContractAddresses.polygon;

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
