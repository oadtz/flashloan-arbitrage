import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/arbitrage";
import { addresses as arbitrageContractAddresses } from "./config/arbitrage";

const routersToCheck = [
  routers.UniSwapPolygon,
  routers.QuickSwap,
  routers.SushiSwapPolygon,
];
const assetsToCheck = [
  {
    token: assets.pWETH,
    amount: 50,
    borrowable: true,
  },
  {
    token: assets.WMATIC,
    amount: 50_000,
    borrowable: true,
  },
  {
    token: assets.pUSDT,
    amount: 500_000,
    borrowable: true,
  },
  {
    token: assets.pUSDC,
    amount: 500_000,
    borrowable: true,
  },
  {
    token: assets.pDAI,
    amount: 12_0000,
    borrowable: true,
  },
  {
    token: assets.pWBTC,
    amount: 1,
    borrowable: true,
  },
  {
    token: assets.pLINK,
    amount: 5_000,
    borrowable: true,
  },
  {
    token: assets.pAAVE,
    amount: 2_000,
    borrowable: true,
  },
];

const slippageTolerance = 0.5;
const flashLoanFee = 0.0005;

const networkProviderUrl = appConfig.polygonRpcUrl;

const arbitrageContractAddress = arbitrageContractAddresses.polygon;

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
