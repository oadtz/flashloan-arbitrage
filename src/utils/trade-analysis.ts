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
  const rsiPeriod = 30;
  const rsiOverbought = 70;
  const macdFastPeriod = 30;
  const macdSlowPeriod = 50;
  const macdSignalPeriod = 15;
  const bbPeriod = 20;
  const bbStdDev = 2;
  const shortTermMA = 50;
  const longTermMA = 100;
  const stochRsiPeriod = 14;
  const stochRsiKPeriod = 3;
  const stochRsiDPeriod = 3;
  const stochRsiOverbought = 70;
  const adxPeriod = 14;
  const adxThreshold = 25;

  // Calculate indicators
  const rsi = RSI.calculate({ values: data, period: rsiPeriod });
  const rsiMA = SMA.calculate({ values: rsi, period: rsiPeriod });
  const rsiDerivative = rsi.slice(1).map((value, index) => value - rsi[index]);
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
  const latestRsiMA = rsiMA[rsiMA.length - 1];
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
  const latestAdx = adx[adx.length - 1]?.adx || 0;

  // Define conditions for a sell signal
  const isRsiDeclining = latestRsiDerivative < 0 && latestRsi > rsiOverbought;
  const isRsiSellSignal = latestRsi > rsiOverbought;
  const isMACDSellSignal = latestMacd < latestMacdSignal && latestMacd < 0; // Ensuring MACD is below zero for additional confirmation
  const isSMASellSignal =
    latestSmaShort < latestSmaLong && previousSmaShort > previousSmaLong;
  const isEMASellSignal =
    latestEmaShort < latestEmaLong && previousEmaShort > previousEmaLong;
  const isStochRsiOverbought =
    latestStochRsiK > stochRsiOverbought &&
    latestStochRsiD > stochRsiOverbought &&
    latestStochRsiK > latestStochRsiD;
  const isStochRsiCross =
    // latestStochRsiK > 30 &&
    // latestStochRsiD > 30 &&
    latestStochRsiK > latestStochRsiD;

  // Simplify the combination of conditions for demonstration purposes
  const isSellSignal =
    isMACDSellSignal &&
    //isRsiSellSignal &&
    //isRsiDeclining &&
    isStochRsiCross &&
    (isSMASellSignal || isEMASellSignal) &&
    true;

  return {
    sell: isSellSignal,
    indicators: {
      rsi: latestRsi,
      rsiDerivative: latestRsiDerivative,
      rsiMA: latestRsiMA,
      macd: latestMacd,
      macdSignal: latestMacdSignal,
      smaShort: latestSmaShort,
      smaLong: latestSmaLong,
      emaShort: latestEmaShort,
      emaLong: latestEmaLong,
      stochRsiK: latestStochRsiK,
      stochRsiD: latestStochRsiD,
      adx: latestAdx,
    },
  };
}
