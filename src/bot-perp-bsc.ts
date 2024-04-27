import { appConfig } from "./config/app";
import { run } from "./utils/perp";
import { addresses as perpContractAddresses } from "./config/perp";
import { addresses as tradeContractAddresses } from "./config/trade";
import { assets } from "./config/assets";

const asset = assets.WBNB;

const delay = 300000;

const networkProviderUrl = appConfig.bscRpcUrl;

const perpContractAddress = perpContractAddresses.bsc;
const tradeContractAddress = tradeContractAddresses.bsc;

run(
  asset,
  networkProviderUrl,
  perpContractAddress,
  tradeContractAddress,
  delay
).catch((error) => {
  console.error(error);
  process.exit(1);
});
