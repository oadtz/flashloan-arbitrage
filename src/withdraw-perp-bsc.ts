import { appConfig } from "./config/app";
import { withdraw } from "./utils/perp";
import { addresses as perpContractAddresses } from "./config/perp";

const gasLimit = 300000;

const networkProviderUrl = appConfig.bscRpcUrl;

const perpContractAddress = perpContractAddresses.bsc;

withdraw(networkProviderUrl, gasLimit, perpContractAddress).catch((error) => {
  console.error(error);
  process.exit(1);
});
