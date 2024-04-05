import { EMA, RSI, StochasticRSI, MACD } from "technicalindicators";
import logger from "./logger";

export function isSellSignal(data: number[]): boolean {
  const shortPeriod: number = 12;
  const longPeriod: number = 26;
  const rsiPeriod: number = 14;
  const rsiThreshold: number = 70;
  const stochRsiPeriod: number = 14;
  const stochRsiThreshold: number = 80;
  const trendPeriod: number = 50;
  const macdFastPeriod: number = 12;
  const macdSlowPeriod: number = 26;
  const macdSignalPeriod: number = 9;

  if (
    data.length <
    Math.max(
      longPeriod,
      rsiPeriod,
      stochRsiPeriod,
      trendPeriod,
      macdSlowPeriod + macdSignalPeriod
    )
  ) {
    logger.warn("Insufficient data points for indicator calculations");
    return false;
  }

  const shortEMA = EMA.calculate({ period: shortPeriod, values: data });
  const longEMA = EMA.calculate({ period: longPeriod, values: data });
  const rsiValues = RSI.calculate({ period: rsiPeriod, values: data });
  const stochRsiValues = StochasticRSI.calculate({
    values: rsiValues,
    rsiPeriod: stochRsiPeriod,
    stochasticPeriod: 14,
    kPeriod: 3,
    dPeriod: 3,
  });
  const trendEMA = EMA.calculate({ period: trendPeriod, values: data });
  const macdValues = MACD.calculate({
    values: data,
    fastPeriod: macdFastPeriod,
    slowPeriod: macdSlowPeriod,
    signalPeriod: macdSignalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const latestShortEMA = shortEMA[shortEMA.length - 1];
  const latestLongEMA = longEMA[longEMA.length - 1];
  const latestRSI = rsiValues[rsiValues.length - 1] || 0;
  const latestStochRsiK = stochRsiValues[stochRsiValues.length - 1]?.k || 0;
  const latestTrendEMA = trendEMA[trendEMA.length - 1];
  const latestPrice = data[data.length - 1];
  const latestMacd = macdValues[macdValues.length - 1]?.MACD || 0;
  const latestMacdSignal = macdValues[macdValues.length - 1]?.signal || 0;

  const isEmaCrossoverSell = latestShortEMA < latestLongEMA;
  const isRsiOverbought = latestRSI > rsiThreshold;
  const isRsiOversold = latestRSI < 100 - rsiThreshold;
  const isStochRsiOverbought = latestStochRsiK > stochRsiThreshold;
  const isStochRsiOversold = latestStochRsiK < 100 - stochRsiThreshold;
  const isUptrend = latestPrice > latestTrendEMA;
  const isDowntrend = latestPrice < latestTrendEMA;
  const isMacdBullish = latestMacd > latestMacdSignal;
  const isMacdBearish = latestMacd < latestMacdSignal;

  logger.info(`Short EMA: ${latestShortEMA}`);
  logger.info(`Long EMA: ${latestLongEMA}`);
  logger.info(`RSI: ${latestRSI}`);
  logger.info(`Stoch RSI: ${latestStochRsiK}`);
  logger.info(`Trend EMA: ${latestTrendEMA}`);
  logger.info(`Latest Price: ${latestPrice}`);
  logger.info(`MACD: ${latestMacd}`);
  logger.info(`MACD Signal: ${latestMacdSignal}`);
  logger.info(`EMA Trend: ${isDowntrend ? "down" : "up"}`);
  logger.info(`MACD Trend: ${isMacdBullish ? "bullish" : "bearish"}`);

  return (
    (isUptrend &&
      isEmaCrossoverSell &&
      isRsiOverbought &&
      isStochRsiOverbought &&
      isMacdBearish) ||
    (isDowntrend && !isRsiOversold && !isStochRsiOversold && !isMacdBullish)
  );
}
