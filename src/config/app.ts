import * as dotenv from "dotenv";

dotenv.config();

export const appConfig = {
  privateKey: process.env.PRIVATE_KEY!,
  localhost: "http://localhost:8545",
  sepoliaRpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  ethereumRpcUrl: "https://eth-pokt.nodies.app",
  bscRpcUrl: `https://bsc-dataseed3.binance.org/`,
  polygonRpcUrl: `https://polygon-rpc.com`,
};
