import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { withdrawTrade } from "./utils/trade";
import { addresses as tradeContractAddresses } from "./config/trade";

const assetsToWithdraw = [assets.BTCB];

const gasLimit = 300000;

const networkProviderUrl = appConfig.bscRpcUrl;

const tradeContractAddress = tradeContractAddresses.btc;

withdrawTrade(
  assetsToWithdraw,
  networkProviderUrl,
  gasLimit,
  tradeContractAddress
).catch((error) => {
  console.error(error);
  process.exit(1);
});
