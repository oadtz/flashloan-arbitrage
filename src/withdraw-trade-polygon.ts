import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { withdrawTrade } from "./utils/trade";
import { addresses as tradeContractAddresses } from "./config/trade";

const assetsToWithdraw = [assets.pUSDT];

const gasLimit = 300000;

const networkProviderUrl = appConfig.polygonRpcUrl;

const tradeContractAddress = tradeContractAddresses.polygon;

withdrawTrade(
  assetsToWithdraw,
  networkProviderUrl,
  gasLimit,
  tradeContractAddress
).catch((error) => {
  console.error(error);
  process.exit(1);
});
