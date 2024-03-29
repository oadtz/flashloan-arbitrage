import * as dotenv from "dotenv";

dotenv.config();

export const appConfig = {
  privateKey: process.env.PRIVATE_KEY!,
  localhost: "http://localhost:8545",
  sepoliaRpcUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  ethereumRpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  bscRpcUrl: `https://bsc-dataseed.binance.org/`,
  polygonRpcUrl: `https://polygon-rpc.com/`,
};
