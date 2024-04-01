import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/trade";
import { addresses as tradeContractAddresses } from "./config/trade";

const routersToCheck = [routers.Local2, routers.Local3];
const tokenToTrade = assets.TOKEN0;

const slippageTolerance = 0.5;
const gasLimit = 3000000;

const networkProviderUrl = appConfig.localhost;

const arbitrageContractAddress = tradeContractAddresses.localhost;

run(
  routersToCheck,
  tokenToTrade,
  slippageTolerance,
  gasLimit,
  networkProviderUrl,
  arbitrageContractAddress,
  10000
).catch((error) => {
  console.error(error);
  process.exit(1);
});
