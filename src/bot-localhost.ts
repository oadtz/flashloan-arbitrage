import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/arbitrage";
import { addresses as arbitrageContractAddresses } from "./config/arbitrage";

const routersToCheck = [routers.Local0, routers.Local1];
const assetsToCheck = [
  {
    token: assets.TOKEN0,
    amount: 1000000,
    borrowable: true,
  },
  {
    token: assets.TOKEN1,
    amount: 2000,
    borrowable: true,
  },
];

const slippageTolerance = 0.5;
const flashLoanFee = 0;

const networkProviderUrl = appConfig.localhost;

const arbitrageContractAddress = arbitrageContractAddresses.localhost;

run(
  routersToCheck,
  assetsToCheck,
  slippageTolerance,
  flashLoanFee,
  networkProviderUrl,
  arbitrageContractAddress,
  1000
).catch((error) => {
  console.error(error);
  process.exit(1);
});
