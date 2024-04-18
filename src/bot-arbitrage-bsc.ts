import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/arbitrage";
import { addresses as arbitrageContractAddresses } from "./config/arbitrage";

const routersToCheck = [routers.PancakeSwap, routers.BiSwap];
const assetsToCheck = [
  // {
  //   token: assets.BTCB,
  //   amount: 10,
  //   borrowable: true,
  // },
  // {
  //   token: assets.ETH,
  //   amount: 200,
  //   borrowable: true,
  // },
  {
    token: assets.WBNB,
    amount: 1_000,
    borrowable: true,
  },
  {
    token: assets.USDT,
    amount: 500_000,
    borrowable: true,
  },
  // {
  //   token: assets.BUSD,
  //   amount: 100_000,
  // },
  // {
  //   token: assets.DOGE,
  //   amount: 2_000_000,
  // },
];

const slippageTolerance = 0; //0.5;
const flashLoanFee = 0.0005;
const delay = 100;

const networkProviderUrl = appConfig.bscRpcUrl;

const arbitrageContractAddress = arbitrageContractAddresses.bsc;

run(
  routersToCheck,
  assetsToCheck,
  slippageTolerance,
  flashLoanFee,
  networkProviderUrl,
  arbitrageContractAddress,
  delay
).catch((error) => {
  console.error(error);
  process.exit(1);
});
