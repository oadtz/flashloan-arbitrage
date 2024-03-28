import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/arbitrage";

const routersToCheck = [routers.UniSwap, routers.SushiSwap];
const assetsToCheck = [
  {
    token: assets.DAI,
    amount: 1000000,
    borrowable: true,
  },
  {
    token: assets.WETH,
    amount: 200,
    borrowable: true,
  },
];

const slippageTolerance = 0.5;
const flashLoanFee = 0.0005;

const networkProviderUrl = appConfig.ethereumRpcUrl;

run(
  routersToCheck,
  assetsToCheck,
  slippageTolerance,
  flashLoanFee,
  networkProviderUrl
).catch((error) => {
  console.error(error);
  process.exit(1);
});
