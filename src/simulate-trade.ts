import { ethers } from "ethers";
import { Asset, assets, getAssetName } from "./config/assets";
import { getRouterName, routers } from "./config/dex";
import logger from "./utils/logger";
import {
  formatDecimals,
  getGasPrice,
  getProvider,
  toDecimals,
} from "./utils/provider";
import { appConfig } from "./config/app";
import _, { shuffle } from "lodash";
import { isSellSignal } from "./utils/is-sell-signal";

const assetsToCheck = [assets.eUSDT];
const routersToCheck = [routers.UniSwap];

const slippageTolerance = 0.5;
const gasLimit = 3000000; // 25000000;
const delay = 30000;

const networkProviderUrl = appConfig.ethereumRpcUrl;

export async function run(
  routersToCheck: string[],
  assetsToCheck: Asset[],
  slippageTolerance: number,
  gasLimit: number,
  networkProviderUrl: string,
  checkSellSignal: boolean,
  delay: number
) {
  console.log("🚀 Starting simulation...");

  const provider = getProvider(networkProviderUrl);

  const _balances: Record<string, bigint> = {
    eth: toDecimals(1, 18),
  };

  const _trades: Record<
    string,
    {
      ethPrices: number[];
      tokenPrices: number[];
      amountETH: bigint;
      amountToken: bigint;
    }
  > = {};

  assetsToCheck.forEach((asset) => {
    _trades[asset.address] = {
      ethPrices: [],
      amountETH: BigInt(0),
      tokenPrices: [],
      amountToken: BigInt(0),
    };
  });

  function getTrades(token: string) {
    return {
      amountETH: _trades[token].amountETH,
      amountToken: _trades[token].amountToken,
    };
  }

  function getETHBalance() {
    return _balances.eth;
  }

  function getTokenBalance(token: string) {
    return _balances[token] || BigInt(0);
  }

  async function checkTrade(
    routersToCheck: string[],
    token: string,
    gasCostLimitInWei: bigint
  ): Promise<[string, string, bigint, bigint, number]> {
    let direction = "none";
    let amountEth = BigInt(0);
    let amountToken = BigInt(0);
    let profitInEth = BigInt(0);
    let profitInToken = BigInt(0);
    let baseLinePrice = 0;

    const router = new ethers.Contract(
      routersToCheck[0],
      [
        {
          constant: true,
          inputs: [
            {
              internalType: "uint256",
              name: "amountIn",
              type: "uint256",
            },
            {
              internalType: "address[]",
              name: "path",
              type: "address[]",
            },
          ],
          name: "getAmountsOut",
          outputs: [
            {
              internalType: "uint256[]",
              name: "amounts",
              type: "uint256[]",
            },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
      ],
      provider.ethers
    );

    if (_balances[token] > 0) {
      const amounts = await router.getAmountsOut(_balances[token], [
        token,
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      ]);

      amountToken = amounts[0];
      amountEth = amounts[1];

      const gasCostLimit = gasCostLimitInWei;

      profitInEth =
        amountEth > gasCostLimit ? amountEth - gasCostLimit : BigInt(0);
    }

    if (_balances.eth > 0) {
      const amounts = await router.getAmountsOut(_balances.eth, [
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        token,
      ]);

      amountEth = amounts[0];
      amountToken = amounts[1];

      const gasCostLimit = (gasCostLimitInWei * amountToken) / amountEth;

      profitInToken =
        amountToken > gasCostLimit ? amountToken - gasCostLimit : BigInt(0);
    }

    const baseLineAmounts = await router.getAmountsOut(toDecimals(1, 18), [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      token,
    ]);
    baseLinePrice =
      +formatDecimals(baseLineAmounts[1], assetsToCheck[0].decimals) /
      +formatDecimals(baseLineAmounts[0], 18);

    if (profitInEth > profitInToken) {
      direction = "token_to_eth";
    } else if (profitInToken > profitInEth) {
      direction = "eth_to_token";
    } else {
      direction = "none";
    }

    return [
      direction,
      routersToCheck[0],
      amountEth,
      amountToken,
      baseLinePrice,
    ];
  }

  async function executeTradeETHForTokens(
    token: string,
    amountEth: bigint,
    expectAmountToken: bigint
  ) {
    const router = new ethers.Contract(
      routersToCheck[0],
      [
        {
          constant: true,
          inputs: [
            {
              internalType: "uint256",
              name: "amountIn",
              type: "uint256",
            },
            {
              internalType: "address[]",
              name: "path",
              type: "address[]",
            },
          ],
          name: "getAmountsOut",
          outputs: [
            {
              internalType: "uint256[]",
              name: "amounts",
              type: "uint256[]",
            },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
      ],
      provider.ethers
    );

    const amounts = await router.getAmountsOut(amountEth, [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      token,
    ]);

    _balances.eth = BigInt(0);
    _balances[token] = amounts[1];
    _trades[token].amountETH = amounts[0];
    _trades[token].amountToken = amounts[1];

    if (_trades[token].amountToken < expectAmountToken) {
      logger.error(
        { error: "INSUFFICIENT_OUTPUT_AMOUNT" },
        "Error performing executeTradeETHForTokens"
      );
      logger.error(`Router: ${router}`);
      logger.error(`Token: ${token}`);
      logger.error(`Amount In: ${_trades[token].amountETH}`);
      logger.error(`Expected Amount Out: ${_trades[token].amountToken}`);
      logger.flush();
      return false;
    }

    return true;
  }

  async function executeTradeTokensForETH(
    token: string,
    amountToken: bigint,
    expectAmountEth: bigint
  ) {
    const router = new ethers.Contract(
      routersToCheck[0],
      [
        {
          constant: true,
          inputs: [
            {
              internalType: "uint256",
              name: "amountIn",
              type: "uint256",
            },
            {
              internalType: "address[]",
              name: "path",
              type: "address[]",
            },
          ],
          name: "getAmountsOut",
          outputs: [
            {
              internalType: "uint256[]",
              name: "amounts",
              type: "uint256[]",
            },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
      ],
      provider.ethers
    );

    const amounts = await router.getAmountsOut(amountToken, [
      token,
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ]);

    _balances[token] = BigInt(0);
    _balances.eth = amounts[1];
    _trades[token].amountToken = amounts[0];
    _trades[token].amountETH = amounts[1];

    if (_trades[token].amountETH < expectAmountEth) {
      logger.error(
        { error: "INSUFFICIENT_OUTPUT_AMOUNT" },
        "Error performing executeTradeTokensForETH"
      );
      logger.error(`Router: ${router}`);
      logger.error(`Token: ${token}`);
      logger.error(`Amount In: ${_trades[token].amountToken}`);
      logger.error(`Expected Amount Out: ${_trades[token].amountETH}`);
      logger.flush();
      return false;
    }

    return true;
  }

  while (true) {
    const shuffledAssets = shuffle(assetsToCheck);
    const tokenToTrade =
      shuffledAssets[Math.floor(Math.random() * shuffledAssets.length)];

    console.log("Checking trade opportunities...");

    const trades = getTrades(tokenToTrade.address);

    console.log(
      `Current _trades for ETH/${getAssetName(
        tokenToTrade.address
      )}: ${formatDecimals(trades.amountETH, 18)}:${formatDecimals(
        trades.amountToken,
        tokenToTrade.decimals
      )}`
    );
    console.log(`Current ETH balance: ${formatDecimals(getETHBalance(), 18)}`);
    console.log(
      `Current token balance: ${formatDecimals(
        getTokenBalance(tokenToTrade.address),
        tokenToTrade.decimals
      )}`
    );

    const gasPrice = await getGasPrice(provider);
    const [direction, router, amountEth, amountToken, baseLinePrice] =
      await checkTrade(
        routersToCheck,
        tokenToTrade.address,
        BigInt(gasLimit) * gasPrice
      );

    console.log(`Result from checkTrade`);
    console.log(`Direction: ${direction}`);
    console.log(`Router: ${router}`);
    console.log(`Amount ETH: ${amountEth}`);
    console.log(`Amount Token: ${amountToken}`);

    // Calculate Token Price
    if (_trades[tokenToTrade.address].tokenPrices.length > 500)
      _trades[tokenToTrade.address].tokenPrices.shift();

    _trades[tokenToTrade.address].tokenPrices.push(baseLinePrice);
    // _trades[tokenToTrade.address].tokenPrices.push(
    //   +formatDecimals(amountToken, tokenToTrade.decimals) /
    //     +formatDecimals(amountEth, 18)
    // );

    // Calculate ETH Price
    if (_trades[tokenToTrade.address].ethPrices.length > 500)
      _trades[tokenToTrade.address].ethPrices.shift();

    _trades[tokenToTrade.address].ethPrices.push(1 / baseLinePrice);
    // _trades[tokenToTrade.address].ethPrices.push(
    //   +formatDecimals(amountEth, 18) /
    //     +formatDecimals(amountToken, tokenToTrade.decimals)
    // );

    if (direction === "eth_to_token") {
      console.log(
        `Data Points: ${_trades[tokenToTrade.address].tokenPrices.length}`
      );

      const sellSignal = isSellSignal(
        _trades[tokenToTrade.address].tokenPrices
      );

      console.log(
        `Amount to trade: ${formatDecimals(amountToken, tokenToTrade.decimals)}`
      );
      console.log(
        `Price: ${
          +formatDecimals(amountToken, tokenToTrade.decimals) /
          +formatDecimals(amountEth, 18)
        } ${getAssetName(tokenToTrade.address)}/ETH`
      );
      console.log(`Sell Signal: ${sellSignal}`);

      logger.warn({
        price0:
          +formatDecimals(amountToken, tokenToTrade.decimals) /
          +formatDecimals(amountEth, 18),
        price1:
          +formatDecimals(amountEth, 18) /
          +formatDecimals(amountToken, tokenToTrade.decimals),
        price2: baseLinePrice,
        price3: 1 / baseLinePrice,
        sellOnETH: sellSignal,
        sellOnToken: false,
      });
      logger.flush();

      if (
        checkSellSignal &&
        !sellSignal
        // ||
        // trades.amountToken +
        //   (amountToken * BigInt(Math.floor(slippageTolerance * 10000))) /
        //     BigInt(1000000) >=
        //   amountToken
      ) {
        console.warn(`❌ Price not good enough, waiting for better price`);
      } else {
        console.log(
          `🎉 Trade opportunity found! ${direction} ${formatDecimals(
            amountEth,
            18
          )} ETH for ${formatDecimals(
            amountToken,
            tokenToTrade.decimals
          )} ${getAssetName(tokenToTrade.address)} on ${getRouterName(router)}`
        );

        console.log(`executeTradeETHForTokens`);
        console.log(`Router: ${router}`);
        console.log(`Token: ${tokenToTrade.address}`);
        console.log(`Amount ETH: ${amountEth}`);
        console.log(`Amount Token: ${amountToken}`);
        console.log(`Gas limit: ${gasLimit}`);

        const result = await executeTradeETHForTokens(
          tokenToTrade.address,
          amountEth,
          // trades.amountToken // For price safe guard
          amountToken -
            (amountToken * BigInt(Math.floor(slippageTolerance * 10000))) /
              BigInt(1000000)
        );

        if (result) {
          // _trades[tokenToTrade.address] = {
          //   ethData: [],
          //   tokenData: [],
          // };

          console.log(`🎉🎉🎉🎉🎉🎉🎉🎉 Trading done`);
        } else {
          `❌ Trading failed`;
          process.exit(1);
        }
      }
    } else if (direction === "token_to_eth") {
      console.log(
        `Data Points: ${_trades[tokenToTrade.address].ethPrices.length}`
      );

      const sellSignal = isSellSignal(_trades[tokenToTrade.address].ethPrices);

      console.log(`Amount to trade: ${formatDecimals(amountEth, 18)}`);
      console.log(
        `Price: ${
          +formatDecimals(amountEth, 18) /
          +formatDecimals(amountToken, tokenToTrade.decimals)
        } ETH/${getAssetName(tokenToTrade.address)}`
      );
      console.log(`Sell Signal: ${sellSignal}`);

      logger.warn({
        price0:
          +formatDecimals(amountToken, tokenToTrade.decimals) /
          +formatDecimals(amountEth, 18),
        price1:
          +formatDecimals(amountEth, 18) /
          +formatDecimals(amountToken, tokenToTrade.decimals),
        price2: baseLinePrice,
        price3: 1 / baseLinePrice,
        sellOnETH: false,
        sellOnToken: sellSignal,
      });
      logger.flush();

      if (
        checkSellSignal &&
        !sellSignal
        // ||
        // trades.amountETH +
        //   (amountEth * BigInt(Math.floor(slippageTolerance * 10000))) /
        //     BigInt(1000000) >=
        //   amountEth
      ) {
        console.warn(`❌ Price not good enough, waiting for better price`);
      } else {
        console.log(
          `🎉 Trade opportunity found! ${direction} ${formatDecimals(
            amountToken,
            tokenToTrade.decimals
          )} ${getAssetName(tokenToTrade.address)} for ${formatDecimals(
            amountEth,
            18
          )} ETH on ${getRouterName(router)}`
        );

        console.log(`executeTradeTokensForETH`);
        console.log(`Router: ${router}`);
        console.log(`Token: ${tokenToTrade.address}`);
        console.log(`Amount Token: ${amountToken}`);
        console.log(`Amount ETH: ${amountEth}`);
        console.log(`Gas limit: ${gasLimit}`);

        const result = await executeTradeTokensForETH(
          tokenToTrade.address,
          amountToken,
          // trades.amountETH // For price safe guard
          amountEth -
            (amountEth * BigInt(Math.floor(slippageTolerance * 10000))) /
              BigInt(1000000)
        );

        if (result) {
          // _trades[tokenToTrade.address] = {
          //   ethData: [],
          //   tokenData: [],
          // };

          console.log(`🎉🎉🎉🎉🎉🎉🎉🎉 Trading done`);
        } else {
          console.error(`❌ Trading failed`);
          process.exit(1);
        }
      }
    } else {
      _trades[tokenToTrade.address] = {
        ethPrices: [],
        amountETH: _trades[tokenToTrade.address].amountETH,
        tokenPrices: [],
        amountToken: _trades[tokenToTrade.address].amountToken,
      };
      console.warn(`❌ Not a trade opportunity`);
    }

    console.log(`After ETH balance: ${formatDecimals(getETHBalance(), 18)}`);
    console.log(
      `After token balance: ${formatDecimals(
        getTokenBalance(tokenToTrade.address),
        tokenToTrade.decimals
      )}\n\n`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

run(
  routersToCheck,
  assetsToCheck,
  slippageTolerance,
  gasLimit,
  networkProviderUrl,
  true,
  delay
).catch((error) => {
  console.error(error);
  process.exit(1);
});
