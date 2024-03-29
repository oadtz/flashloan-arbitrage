import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

interface DexRouter {
  address: string;
  abi: any[];
}

interface AssetPair {
  address1: string;
  address2: string;
  amountAsset1ToRouter1: number;
}

interface ArbitrageOpportunity {
  dexRouter1: string;
  dexRouter2: string;
  assetAddress1: string;
  assetAddress2: string;
  amountAsset1ToRouter1: number;
  expectedAmountAsset1FromRouter2: number;
}

class ArbitrageBot {
  private provider: ethers.JsonRpcProvider;
  private dexRouters: DexRouter[];
  private assetPairs: AssetPair[];

  constructor(
    web3Provider: string,
    dexRouters: DexRouter[],
    assetPairs: AssetPair[]
  ) {
    this.provider = new ethers.JsonRpcProvider(web3Provider);
    this.dexRouters = dexRouters;
    this.assetPairs = assetPairs;
  }

  async findArbitrageOpportunities(): Promise<void> {
    for (const assetPair of this.assetPairs) {
      for (let i = 0; i < this.dexRouters.length - 1; i++) {
        for (let j = i + 1; j < this.dexRouters.length; j++) {
          const dexRouter1 = this.dexRouters[i];
          const dexRouter2 = this.dexRouters[j];

          const amountAsset1ToRouter1 = Number(
            ethers.parseEther(assetPair.amountAsset1ToRouter1.toString())
          );
          const expectedAmountAsset1FromRouter2 = await this.getExpectedAmount(
            dexRouter1,
            dexRouter2,
            assetPair.address1,
            assetPair.address2,
            amountAsset1ToRouter1
          );

          const opportunity: ArbitrageOpportunity = {
            dexRouter1: dexRouter1.address,
            dexRouter2: dexRouter2.address,
            assetAddress1: assetPair.address1,
            assetAddress2: assetPair.address2,
            amountAsset1ToRouter1,
            expectedAmountAsset1FromRouter2,
          };
          this.printArbitrageOpportunity(opportunity);

          if (expectedAmountAsset1FromRouter2 > amountAsset1ToRouter1) {
            console.log("🥰 Arbitrage Opportunity Found!");
          } else {
            console.log("😭 No Arbitrage Opportunity Found!");
          }
        }
      }
    }
  }

  private async getExpectedAmount(
    dexRouter1: DexRouter,
    dexRouter2: DexRouter,
    assetAddress1: string,
    assetAddress2: string,
    amountAsset1: number
  ): Promise<number> {
    const router1Contract = new ethers.Contract(
      dexRouter1.address,
      dexRouter1.abi,
      this.provider
    );
    const router2Contract = new ethers.Contract(
      dexRouter2.address,
      dexRouter2.abi,
      this.provider
    );

    const amountsOut1 = await router1Contract.getAmountsOut(
      amountAsset1.toString(),
      [assetAddress1, assetAddress2]
    );
    const amountAsset2FromRouter1 = parseFloat(amountsOut1[1]);

    const amountsOut2 = await router2Contract.getAmountsOut(
      amountAsset2FromRouter1,
      [assetAddress2, assetAddress1]
    );

    const expectedAmountAsset1FromRouter2 = parseFloat(amountsOut2[1]);

    return expectedAmountAsset1FromRouter2;
  }

  private printArbitrageOpportunity(opportunity: ArbitrageOpportunity): void {
    console.log("DEX Router Address 1:", opportunity.dexRouter1);
    console.log("DEX Router Address 2:", opportunity.dexRouter2);
    console.log("Asset Address 1:", opportunity.assetAddress1);
    console.log("Asset Address 2:", opportunity.assetAddress2);
    console.log(
      "Amount of Asset 1 to Router 1:",
      opportunity.amountAsset1ToRouter1
    );
    console.log(
      "Expected Amount of Asset 1 from Router 2:",
      opportunity.expectedAmountAsset1FromRouter2
    );
    console.log("---");
  }
}

// Sample data
const web3Provider = `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
const routerAbi: any[] = [
  {
    constant: true,
    inputs: [
      {
        name: "amountIn",
        type: "uint256",
      },
      {
        name: "path",
        type: "address[]",
      },
    ],
    name: "getAmountsOut",
    outputs: [
      {
        name: "amounts",
        type: "uint256[]",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];
const dexRouters: DexRouter[] = [
  {
    address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap Router address
    abi: routerAbi,
  },
  {
    address: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", // SushiSwap Router address
    abi: routerAbi,
  },
  {
    address: "0x11111112542D85B3EF69AE05771c2dCCff4fAa26", // 1inch Router address
    abi: routerAbi,
  },
];
const assetPairs: AssetPair[] = [
  {
    address1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH address
    address2: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT address
    amountAsset1ToRouter1: 1,
  },
  {
    address1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH address
    address2: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC address
    amountAsset1ToRouter1: 0.5,
  },
  {
    address1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH address
    address2: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI address
    amountAsset1ToRouter1: 2,
  },
  {
    address1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT address
    address2: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC address
    amountAsset1ToRouter1: 1000,
  },
  {
    address1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT address
    address2: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI address
    amountAsset1ToRouter1: 500,
  },
];

const arbitrageBot = new ArbitrageBot(web3Provider, dexRouters, assetPairs);

async function main() {
  while (true) {
    console.log("Searching for arbitrage opportunities...");
    await arbitrageBot.findArbitrageOpportunities();
    console.log("Waiting for 60 seconds before the next check...");
    await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait for 60 seconds before the next check
  }
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
