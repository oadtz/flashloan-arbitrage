import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/trade";
import { addresses as tradeContractAddresses } from "./config/trade";

const routersToCheck = [routers.PancakeSwap, routers.BiSwap];
const assetsToCheck = [assets.USDT];

const slippageTolerance = 0.5;
const gasLimit = 300000;

const networkProviderUrl = appConfig.bscRpcUrl;

const tradeContractAddress = tradeContractAddresses.bsc;

run(
  routersToCheck,
  assetsToCheck,
  slippageTolerance,
  gasLimit,
  networkProviderUrl,
  tradeContractAddress,
  10000
).catch((error) => {
  console.error(error);
  process.exit(1);
});
