import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { withdrawTrade } from "./utils/trade";
import { addresses as tradeContractAddresses } from "./config/trade";

const assetsToWithdraw = [assets.PEPE];

const gasLimit = 300000;

const networkProviderUrl = appConfig.ethereumRpcUrl;

const tradeContractAddress = tradeContractAddresses.ethereum;

withdrawTrade(
  assetsToWithdraw,
  networkProviderUrl,
  gasLimit,
  tradeContractAddress
).catch((error) => {
  console.error(error);
  process.exit(1);
});
