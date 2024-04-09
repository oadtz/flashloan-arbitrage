import * as fs from "fs";
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
import { isSellSignal } from "./utils/trade-analysis";

const assetsToCheck = [assets.eUSDT];
const routersToCheck = [routers.UniSwap];
const WETH = assets.WETH.address;

const slippageTolerance = 0.5;
const gasLimit = 3000000; // 25000000;
const delay = 0;

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

  let epoch = 0;

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

    if (_balances[token] > 0) {
      const amounts = await getAmountsOut(_balances[token], [token, WETH]);

      amountToken = amounts[0];
      amountEth = amounts[1];

      const gasCostLimit = gasCostLimitInWei;

      profitInEth =
        amountEth > gasCostLimit ? amountEth - gasCostLimit : BigInt(0);
    }

    if (_balances.eth > 0) {
      const amounts = await getAmountsOut(_balances.eth, [WETH, token]);

      amountEth = amounts[0];
      amountToken = amounts[1];

      const gasCostLimit = (gasCostLimitInWei * amountToken) / amountEth;

      profitInToken =
        amountToken > gasCostLimit ? amountToken - gasCostLimit : BigInt(0);
    }

    const baseLineAmounts = await getAmountsOut(toDecimals(1, 18), [
      WETH,
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

  async function getAmountsOut(amountIn: bigint, path: string[]) {
    if (fs.existsSync("price.log")) {
      const data = fs.readFileSync("price.log", "utf8");
      const lines = data.split("\n");

      try {
        const priceData = JSON.parse(lines[epoch]);

        // For simulation we only use the baseline prices
        if (priceData.price2 && priceData.price3) {
          if (amountIn === toDecimals(1, 18) && path[0] === WETH) {
            return [
              amountIn,
              BigInt(
                Math.round(
                  priceData.price2 *
                    +formatDecimals(amountIn, 18) *
                    10 ** assetsToCheck[0].decimals
                )
              ),
            ];
          } else if (path[0] === WETH) {
            return [
              amountIn,
              BigInt(
                Math.round(
                  priceData.price2 *
                    +formatDecimals(amountIn, 18) *
                    10 ** assetsToCheck[0].decimals
                )
              ),
            ];
          } else {
            console.log(priceData.price3, amountIn);
            return [
              amountIn,
              BigInt(
                Math.round(
                  priceData.price3 *
                    +formatDecimals(amountIn, assetsToCheck[0].decimals) *
                    10 ** 18
                )
              ),
            ];
          }
        }
      } catch (e) {
        throw new Error(
          "✅ No more data to read from price.log. Please run the bot again."
        );
      }
    } else {
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

      return await router.getAmountsOut(amountIn, path);
    }
  }

  async function executeTradeETHForTokens(
    token: string,
    amountEth: bigint,
    expectAmountToken: bigint
  ) {
    // const router = new ethers.Contract(
    //   routersToCheck[0],
    //   [
    //     {
    //       constant: true,
    //       inputs: [
    //         {
    //           internalType: "uint256",
    //           name: "amountIn",
    //           type: "uint256",
    //         },
    //         {
    //           internalType: "address[]",
    //           name: "path",
    //           type: "address[]",
    //         },
    //       ],
    //       name: "getAmountsOut",
    //       outputs: [
    //         {
    //           internalType: "uint256[]",
    //           name: "amounts",
    //           type: "uint256[]",
    //         },
    //       ],
    //       payable: false,
    //       stateMutability: "view",
    //       type: "function",
    //     },
    //   ],
    //   provider.ethers
    // );

    const amounts = await getAmountsOut(amountEth, [WETH, token]);

    _balances.eth = BigInt(0);
    _balances[token] = amounts[1];
    _trades[token].amountETH = amounts[0];
    _trades[token].amountToken = amounts[1];

    if (_trades[token].amountToken < expectAmountToken) {
      logger.error(
        { error: "INSUFFICIENT_OUTPUT_AMOUNT" },
        "Error performing executeTradeETHForTokens"
      );
      //logger.error(`Router: ${router}`);
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
    // const router = new ethers.Contract(
    //   routersToCheck[0],
    //   [
    //     {
    //       constant: true,
    //       inputs: [
    //         {
    //           internalType: "uint256",
    //           name: "amountIn",
    //           type: "uint256",
    //         },
    //         {
    //           internalType: "address[]",
    //           name: "path",
    //           type: "address[]",
    //         },
    //       ],
    //       name: "getAmountsOut",
    //       outputs: [
    //         {
    //           internalType: "uint256[]",
    //           name: "amounts",
    //           type: "uint256[]",
    //         },
    //       ],
    //       payable: false,
    //       stateMutability: "view",
    //       type: "function",
    //     },
    //   ],
    //   provider.ethers
    // );

    const amounts = await getAmountsOut(amountToken, [token, WETH]);

    _balances[token] = BigInt(0);
    _balances.eth = amounts[1];
    _trades[token].amountToken = amounts[0];
    _trades[token].amountETH = amounts[1];

    if (_trades[token].amountETH < expectAmountEth) {
      logger.error(
        { error: "INSUFFICIENT_OUTPUT_AMOUNT" },
        "Error performing executeTradeTokensForETH"
      );
      //logger.error(`Router: ${router}`);
      logger.error(`Token: ${token}`);
      logger.error(`Amount In: ${_trades[token].amountToken}`);
      logger.error(`Expected Amount Out: ${_trades[token].amountETH}`);
      logger.flush();
      return false;
    }

    return true;
  }

  const gasPrice = await getGasPrice(provider);
  while (true) {
    const shuffledAssets = shuffle(assetsToCheck);
    const tokenToTrade =
      shuffledAssets[Math.floor(Math.random() * shuffledAssets.length)];

    console.log("Checking trade opportunities...");

    console.log(`Epoch: ${epoch}`);

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

      const { sell: sellSignal } = isSellSignal(
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

      const { sell: sellSignal } = isSellSignal(
        _trades[tokenToTrade.address].ethPrices
      );

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

    epoch++;
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
