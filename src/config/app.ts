import * as dotenv from "dotenv";

dotenv.config();

export const appConfig = {
  privateKey: process.env.PRIVATE_KEY!,
  ethereumRpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  bscRpcUrl: `https://bsc-dataseed.binance.org/`,
};
