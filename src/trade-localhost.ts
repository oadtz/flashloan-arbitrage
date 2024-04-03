import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/trade";
import { addresses as tradeContractAddresses } from "./config/trade";

const routersToCheck = [routers.Local0, routers.Local1];
const assetsToCheck = [assets.TOKEN0, assets.TOKEN1];

const slippageTolerance = 0.5;
const gasLimit = 300000;

const networkProviderUrl = appConfig.localhost;

const arbitrageContractAddress = tradeContractAddresses.localhost;

run(
  routersToCheck,
  assetsToCheck,
  slippageTolerance,
  gasLimit,
  networkProviderUrl,
  arbitrageContractAddress,
  5000
).catch((error) => {
  console.error(error);
  process.exit(1);
});
