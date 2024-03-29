import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/arbitrage";

const routersToCheck = [routers.UniSwap, routers.SushiSwap, routers.FraxSwap];
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
  {
    token: assets.WBTC,
    amount: 10,
    borrowable: true,
  },
  {
    token: assets.USDC,
    amount: 100000,
    borrowable: true,
  },
  {
    token: assets.eUSDT,
    amount: 100000,
    borrowable: true,
  },
  {
    token: assets.LINK,
    amount: 10000,
    borrowable: true,
  },
  {
    token: assets.rETH,
    amount: 50,
    borrowable: true,
  },
  {
    token: assets.AAVE,
    amount: 1000,
    borrowable: true,
  },
  {
    token: assets.AAVE,
    amount: 20000,
  },
  {
    token: assets.SHIB,
    amount: 10000000000,
  },
  {
    token: assets.FRAX,
    amount: 100000,
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
  networkProviderUrl,
  10000
).catch((error) => {
  console.error(error);
  process.exit(1);
});
