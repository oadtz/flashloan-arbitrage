import * as dotenv from "dotenv";

dotenv.config();

export const appConfig = {
  privateKey: process.env.PRIVATE_KEY!,
  localhost: "http://localhost:8545",
  sepoliaRpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  ethereumRpcUrl: "https://eth-pokt.nodies.app",
  bscRpcUrl: `https://bsc-dataseed3.binance.org/`,
  polygonRpcUrl: `https://polygon-mainnet.infura.io/v3/760b1f010f744e2dac11f4fd1cbf2b4e`,
};
