import { routers } from "./config/dex";
import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { run } from "./utils/arbitrage";
import { addresses as arbitrageContractAddresses } from "./config/arbitrage";

const routersToCheck = [routers.UniSwap, routers.SushiSwap];
const assetsToCheck = [
  {
    token: assets.DAI,
    amount: 1_000_000,
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
    amount: 100_000,
    borrowable: true,
  },
  {
    token: assets.eUSDT,
    amount: 100_000,
    borrowable: true,
  },
  {
    token: assets.LINK,
    amount: 10_000,
    borrowable: true,
  },
  {
    token: assets.rETH,
    amount: 50,
    borrowable: true,
  },
  {
    token: assets.AAVE,
    amount: 1_000,
    borrowable: true,
  },
  {
    token: assets.AAVE,
    amount: 20_000,
  },
  {
    token: assets.SHIB,
    amount: 10_000_000_000,
  },
  {
    token: assets.FRAX,
    amount: 100_000,
  },
];

const slippageTolerance = 0; //0.5;
const flashLoanFee = 0.0005;

const networkProviderUrl = appConfig.ethereumRpcUrl;

const arbitrageContractAddress = arbitrageContractAddresses.ethereum;

run(
  routersToCheck,
  assetsToCheck,
  slippageTolerance,
  flashLoanFee,
  networkProviderUrl,
  arbitrageContractAddress,
  0
).catch((error) => {
  console.error(error);
  process.exit(1);
});
