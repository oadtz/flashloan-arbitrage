import { appConfig } from "./config/app";
import { run } from "./utils/perp";
import { addresses as perpContractAddresses } from "./config/perp";
import { assets } from "./config/assets";

const asset = assets.WBNB;

const networkProviderUrl = appConfig.localhost;

const tradeContractAddress = perpContractAddresses.localhost;

run(asset, networkProviderUrl, tradeContractAddress).catch((error) => {
  console.error(error);
  process.exit(1);
});
