import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/arbitrage";
import { addresses as arbitrageContractAddresses } from "./config/arbitrage";

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
    amount: 1,
    borrowable: true,
  },
  {
    token: assets.ETH,
    amount: 10,
    borrowable: true,
  },
  {
    token: assets.WBNB,
    amount: 100,
    borrowable: true,
  },
  {
    token: assets.USDT,
    amount: 10_000,
    borrowable: true,
  },
  {
    token: assets.BUSD,
    amount: 10_000,
  },
  {
    token: assets.DOGE,
    amount: 2_000_000,
  },
];

const slippageTolerance = 0; //0.5;
const flashLoanFee = 0.0005;

const networkProviderUrl = appConfig.bscRpcUrl;

const arbitrageContractAddress = arbitrageContractAddresses.bsc;

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
