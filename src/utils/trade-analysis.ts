import {
  RSI,
  MACD,
  BollingerBands,
  SMA,
  EMA,
  StochasticRSI,
  ADX,
} from "technicalindicators";

export function isSellSignal(data: number[]): {
  sell: boolean;
  indicators?: any;
} {
  // Configuration for various indicators
  const rsiPeriod = 14;
  const rsiOverbought = 70;
  const macdFastPeriod = 12;
  const macdSlowPeriod = 26;
  const macdSignalPeriod = 9;
  const bbPeriod = 20;
  const bbStdDev = 2;
  const shortTermMA = 50;
  const longTermMA = 100;
  const stochRsiPeriod = 14;
  const stochRsiKPeriod = 3;
  const stochRsiDPeriod = 3;
  const stochRsiOverbought = 80;
  const adxPeriod = 14;
  const adxThreshold = 25;

  // Calculate RSI and its derivative
  const rsi = RSI.calculate({ values: data, period: rsiPeriod });
  const rsiDerivative = rsi.slice(1).map((value, index) => value - rsi[index]);

  // Calculate MACD
  const macd = MACD.calculate({
    values: data,
    fastPeriod: macdFastPeriod,
    slowPeriod: macdSlowPeriod,
    signalPeriod: macdSignalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  // Additional indicator calculations...
  const bb = BollingerBands.calculate({
    values: data,
    period: bbPeriod,
    stdDev: bbStdDev,
  });
  const smaShort = SMA.calculate({ values: data, period: shortTermMA });
  const smaLong = SMA.calculate({ values: data, period: longTermMA });
  const emaShort = EMA.calculate({ values: data, period: shortTermMA });
  const emaLong = EMA.calculate({ values: data, period: longTermMA });
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

  // Extract latest values for each indicator
  const latestRsi = rsi[rsi.length - 1];
  const latestRsiDerivative = rsiDerivative[rsiDerivative.length - 1];
  const latestMacd = macd[macd.length - 1]?.MACD || 0;
  const latestMacdSignal = macd[macd.length - 1]?.signal || 0;
  const previousSmaShort =
    smaShort.length > 1 ? smaShort[smaShort.length - 2] : 0;
  const previousSmaLong = smaLong.length > 1 ? smaLong[smaLong.length - 2] : 0;
  const latestSmaShort = smaShort[smaShort.length - 1];
  const latestSmaLong = smaLong[smaLong.length - 1];
  const previousEmaShort =
    emaShort.length > 1 ? emaShort[emaShort.length - 2] : 0;
  const previousEmaLong = emaLong.length > 1 ? emaLong[emaLong.length - 2] : 0;
  const latestEmaShort = emaShort[emaShort.length - 1];
  const latestEmaLong = emaLong[emaLong.length - 1];
  const latestStochRsiK = stochRsi[stochRsi.length - 1]?.k || 0;
  const latestStochRsiD = stochRsi[stochRsi.length - 1]?.d || 0;

  // Define conditions for a sell signal
  const isRsiDeclining = latestRsiDerivative < 0 && latestRsi > rsiOverbought;
  const isMacdBearishCross = latestMacd < latestMacdSignal && latestMacd < 0; // Ensuring MACD is below zero for additional confirmation
  const isSMASellSignal =
    latestSmaShort < latestSmaLong && previousSmaShort > previousSmaLong;
  const isEMASellSignal =
    latestEmaShort < latestEmaLong && previousEmaShort > previousEmaLong;
  // const isStochRsiOverbought =
  //   latestStochRsiK > stochRsiOverbought &&
  //   latestStochRsiD > stochRsiOverbought &&
  //   latestStochRsiK > latestStochRsiD;
  const isStochRsiCross =
    latestStochRsiK <= stochRsiOverbought &&
    latestStochRsiD <= stochRsiOverbought &&
    latestStochRsiK <= latestStochRsiD;

  // Simplify the combination of conditions for demonstration purposes
  const isSellSignal =
    (isRsiDeclining || isMacdBearishCross) &&
    isStochRsiCross &&
    (isSMASellSignal || isEMASellSignal);
  // const isSellSignal = isStochRsiCross && (isSMASellSignal || isEMASellSignal);

  return {
    sell: isSellSignal,
    indicators: {
      rsi: latestRsi,
      rsiDerivative: latestRsiDerivative,
      macd: latestMacd,
      macdSignal: latestMacdSignal,
    },
  };
}

// import {
//   RSI,
//   MACD,
//   BollingerBands,
//   SMA,
//   EMA,
//   StochasticRSI,
//   ADX,
// } from "technicalindicators";

// export function isSellSignal(data: number[]): {
//   sell: boolean;
//   indicators?: any;
// } {
//   const rsiPeriod = 14;
//   const rsiOverbought = 70;
//   const macdFastPeriod = 12;
//   const macdSlowPeriod = 26;
//   const macdSignalPeriod = 9;
//   const bbPeriod = 20;
//   const bbStdDev = 2;
//   const shortTermMA = 50;
//   const longTermMA = 100;
//   const stochRsiPeriod = 14;
//   const stochRsiKPeriod = 3;
//   const stochRsiDPeriod = 3;
//   const stochRsiOverbought = 80;
//   const adxPeriod = 14;
//   const adxThreshold = 25;

//   const rsi = RSI.calculate({ values: data, period: rsiPeriod });
//   const macd = MACD.calculate({
//     values: data,
//     fastPeriod: macdFastPeriod,
//     slowPeriod: macdSlowPeriod,
//     signalPeriod: macdSignalPeriod,
//     SimpleMAOscillator: false,
//     SimpleMASignal: false,
//   });
//   const bb = BollingerBands.calculate({
//     values: data,
//     period: bbPeriod,
//     stdDev: bbStdDev,
//   });
//   const smaShort = SMA.calculate({ values: data, period: shortTermMA });
//   const smaLong = SMA.calculate({ values: data, period: longTermMA });
//   const emaShort = EMA.calculate({ values: data, period: shortTermMA });
//   const emaLong = EMA.calculate({ values: data, period: longTermMA });
//   const stochRsi = StochasticRSI.calculate({
//     values: data,
//     rsiPeriod: stochRsiPeriod,
//     stochasticPeriod: stochRsiPeriod,
//     kPeriod: stochRsiKPeriod,
//     dPeriod: stochRsiDPeriod,
//   });
//   const adx = ADX.calculate({
//     high: data,
//     low: data,
//     close: data,
//     period: adxPeriod,
//   });

//   const latestPrice = data[data.length - 1];
//   const latestRsi = rsi[rsi.length - 1];
//   const latestMacd = macd[macd.length - 1]?.MACD || 0;
//   const latestMacdSignal = macd[macd.length - 1]?.signal || 0;
//   const latestBbUpper = bb[bb.length - 1]?.upper || 0;
//   const previousSmaShort =
//     smaShort.length > 1 ? smaShort[smaShort.length - 2] : 0;
//   const previousSmaLong = smaLong.length > 1 ? smaLong[smaLong.length - 2] : 0;
//   const latestSmaShort = smaShort[smaShort.length - 1];
//   const latestSmaLong = smaLong[smaLong.length - 1];
//   const previousEmaShort =
//     emaShort.length > 1 ? emaShort[emaShort.length - 2] : 0;
//   const previousEmaLong = emaLong.length > 1 ? emaLong[emaLong.length - 2] : 0;
//   const latestEmaShort = emaShort[emaShort.length - 1];
//   const latestEmaLong = emaLong[emaLong.length - 1];
//   const latestStochRsiK = stochRsi[stochRsi.length - 1]?.k || 0;
//   const latestStochRsiD = stochRsi[stochRsi.length - 1]?.d || 0;
//   const latestAdx = adx[adx.length - 1]?.adx || 0;

//   // RSI Overbought
//   const isRsiOverbought = latestRsi > rsiOverbought;

//   // MACD Crossover
//   const isMacdBearish = latestMacd < latestMacdSignal;

//   // Bollinger Bands Overbought
//   const isBbOverbought = latestPrice > latestBbUpper;

//   // Moving Average Crossover
//   const isSMASellSignal =
//     latestSmaShort < latestSmaLong && previousSmaShort > previousSmaLong;
//   const isEMASellSignal =
//     latestEmaShort < latestEmaLong && previousEmaShort > previousEmaLong;

//   // Stochastic RSI Overbought
//   const isStochRsiOverbought =
//     latestStochRsiK > stochRsiOverbought &&
//     latestStochRsiD > stochRsiOverbought &&
//     latestStochRsiK > latestStochRsiD;

//   // ADX Trend Strength
//   const isStrongTrend = latestAdx > adxThreshold;

//   // Combine multiple sell signals
//   const isSellSignal =
//     //isRsiOverbought &&
//     //isStochRsiOverbought &&
//     //isBbOverbought &&
//     //isMacdBearish &&
//     (isSMASellSignal || isEMASellSignal) &&
//     // isStrongTrend &&
//     true;

//   return {
//     sell: isSellSignal,
//     indicators: {
//       rsi: latestRsi,
//       macd: latestMacd,
//       macdSignal: latestMacdSignal,
//       bbUpper: latestBbUpper,
//       smaShort: latestSmaShort,
//       smaLong: latestSmaLong,
//       emaShort: latestEmaShort,
//       emaLong: latestEmaLong,
//       stochRsiK: latestStochRsiK,
//       stochRsiD: latestStochRsiD,
//       adx: latestAdx,
//     },
//   };
// }
