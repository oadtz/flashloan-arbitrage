import { appConfig } from "./config/app";
import { run } from "./utils/perp";
import { addresses as perpContractAddresses } from "./config/perp";
import { assets } from "./config/assets";

const asset = assets.WBNB;

const delay = 10000;

const networkProviderUrl = appConfig.localhost;

const perpContractAddress = perpContractAddresses.localhost;

run(
  asset,
  networkProviderUrl,
  perpContractAddress,
  "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  delay
).catch((error) => {
  console.error(error);
  process.exit(1);
});
