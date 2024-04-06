import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/trade";
import { addresses as tradeContractAddresses } from "./config/trade";

const routersToCheck = [routers.UniSwapPolygon];
const assetsToCheck = [assets.pUSDT, assets.pWETH, assets.pWBTC];

const slippageTolerance = 0.5;
const gasLimit = 3000000; // 25000000;

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
  10000
).catch((error) => {
  console.error(error);
  process.exit(1);
});
