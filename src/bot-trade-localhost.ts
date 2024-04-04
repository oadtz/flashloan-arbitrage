import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/trade";
import { addresses as tradeContractAddresses } from "./config/trade";

const routersToCheck = [routers.Local2, routers.Local3];
const assetsToCheck = [assets.TOKEN2, assets.TOKEN3];

const slippageTolerance = 0.5;
const gasLimit = 300000;

const networkProviderUrl = appConfig.localhost;

const tradeContractAddress = tradeContractAddresses.localhost;

run(
  routersToCheck,
  assetsToCheck,
  slippageTolerance,
  gasLimit,
  networkProviderUrl,
  tradeContractAddress,
  false,
  5000
).catch((error) => {
  console.error(error);
  process.exit(1);
});
