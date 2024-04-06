import logger from "./logger";
import {
  RSI,
  MACD,
  BollingerBands,
  SMA,
  EMA,
  StochasticRSI,
  ADX,
} from "technicalindicators";

export function isSellSignal(data: number[]): boolean {
  const rsiPeriod = 14;
  const rsiOverbought = 70;
  const macdFastPeriod = 12;
  const macdSlowPeriod = 26;
  const macdSignalPeriod = 9;
  const bbPeriod = 20;
  const bbStdDev = 2;
  const shortTermMA = 50;
  const longTermMA = 200;
  const stochRsiPeriod = 14;
  const stochRsiKPeriod = 3;
  const stochRsiDPeriod = 3;
  const stochRsiOverbought = 80;
  const adxPeriod = 14;
  const adxThreshold = 25;

  // if (
  //   data.length <
  //   Math.max(
  //     rsiPeriod,
  //     macdSlowPeriod + macdSignalPeriod,
  //     bbPeriod,
  //     longTermMA,
  //     stochRsiPeriod + stochRsiKPeriod + stochRsiDPeriod - 2,
  //     adxPeriod
  //   )
  // ) {
  //   // Not enough data points to calculate the required indicators
  //   return false;
  // }

  const rsi = RSI.calculate({ values: data, period: rsiPeriod });
  const macd = MACD.calculate({
    values: data,
    fastPeriod: macdFastPeriod,
    slowPeriod: macdSlowPeriod,
    signalPeriod: macdSignalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const bb = BollingerBands.calculate({
    values: data,
    period: bbPeriod,
    stdDev: bbStdDev,
  });
  const sma50 = SMA.calculate({ values: data, period: shortTermMA });
  const sma200 = SMA.calculate({ values: data, period: longTermMA });
  const ema50 = EMA.calculate({ values: data, period: shortTermMA });
  const ema200 = EMA.calculate({ values: data, period: longTermMA });
  const stochRsi = StochasticRSI.calculate({
    values: data,
    rsiPeriod: stochRsiPeriod,
    stochasticPeriod: stochRsiPeriod,
    kPeriod: stochRsiKPeriod,
    dPeriod: stochRsiDPeriod,
  });
  const adx = ADX.calculate({
    high: data,
    low: data,
    close: data,
    period: adxPeriod,
  });

  const latestPrice = data[data.length - 1];
  const latestRsi = rsi[rsi.length - 1];
  const latestMacd = macd[macd.length - 1]?.MACD || 0;
  const latestMacdSignal = macd[macd.length - 1]?.signal || 0;
  const latestBbUpper = bb[bb.length - 1]?.upper || 0;
  const latestSma50 = sma50[sma50.length - 1];
  const latestSma200 = sma200[sma200.length - 1];
  const latestEma50 = ema50[ema50.length - 1];
  const latestEma200 = ema200[ema200.length - 1];
  const latestStochRsiK = stochRsi[stochRsi.length - 1]?.k || 0;
  const latestStochRsiD = stochRsi[stochRsi.length - 1]?.d || 0;
  const latestAdx = adx[adx.length - 1]?.adx || 0;

  // RSI Overbought
  const isRsiOverbought = latestRsi > rsiOverbought;

  // MACD Crossover
  const isMacdBearish = latestMacd < latestMacdSignal;

  // Bollinger Bands Overbought
  const isBbOverbought = latestPrice > latestBbUpper;

  // Moving Average Crossover
  const isShortTermBelowLongTermSMA = latestSma50 < latestSma200;
  const isShortTermBelowLongTermEMA = latestEma50 < latestEma200;

  // Stochastic RSI Overbought
  const isStochRsiOverbought =
    latestStochRsiK > stochRsiOverbought &&
    latestStochRsiD > stochRsiOverbought &&
    latestStochRsiK > latestStochRsiD;

  // ADX Trend Strength
  const isStrongTrend = latestAdx > adxThreshold;

  // Combine multiple sell signals
  const isSellSignal =
    //isRsiOverbought &&
    isStochRsiOverbought &&
    isBbOverbought &&
    //isMacdBearish &&
    //(isShortTermBelowLongTermSMA || isShortTermBelowLongTermEMA) &&
    //isStrongTrend &&
    true;

  // logger.info({
  //   price: latestPrice,
  //   rsi: latestRsi,
  //   macd: latestMacd,
  //   macdSignal: latestMacdSignal,
  //   bbUpper: latestBbUpper,
  //   sma50: latestSma50,
  //   sma200: latestSma200,
  //   ema50: latestEma50,
  //   ema200: latestEma200,
  //   stochRsiK: latestStochRsiK,
  //   stochRsiD: latestStochRsiD,
  //   adx: latestAdx,
  //   sell: isSellSignal,
  // });

  return isSellSignal;
}
