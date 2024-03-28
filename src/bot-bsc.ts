import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/arbitrage";

const routersToCheck = [
  routers.PancakeSwap,
  routers.BiSwap,
  routers.MDEX,
  routers.ApeSwap,
  routers.UniSwapV2,
];
const assetsToCheck = [
  {
    token: assets.BTCB,
    amount: 10,
    borrowable: true,
  },
  {
    token: assets.ETH,
    amount: 100,
    borrowable: true,
  },
  {
    token: assets.WBNB,
    amount: 1000,
    borrowable: true,
  },
  {
    token: assets.USDT,
    amount: 100000,
    borrowable: true,
  },
  {
    token: assets.BUSD,
    amount: 100000,
  },
  {
    token: assets.CAT,
    amount: 10000000000000,
  },
];

const slippageTolerance = 0.5;
const flashLoanFee = 0.0005;

const networkProviderUrl = appConfig.bscRpcUrl;

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
