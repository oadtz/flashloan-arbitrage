import { assets } from "./config/assets";
import { appConfig } from "./config/app";
import { withdrawTrade } from "./utils/trade";
import { addresses as tradeContractAddresses } from "./config/trade";

const assetsToWithdraw = [assets.TOKEN0, assets.TOKEN1];

const gasLimit = 300000;

const networkProviderUrl = appConfig.localhost;

const tradeContractAddress = tradeContractAddresses.localhost;

withdrawTrade(
  assetsToWithdraw,
  networkProviderUrl,
  gasLimit,
  tradeContractAddress
).catch((error) => {
  console.error(error);
  process.exit(1);
});
