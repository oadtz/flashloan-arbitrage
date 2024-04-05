import { EMA, RSI, StochasticRSI } from "technicalindicators";
import logger from "./logger";

export function isSellSignal(data: number[]): boolean {
  const shortPeriod: number = 10;
  const longPeriod: number = 30;
  const rsiPeriod: number = 14;
  const rsiThreshold: number = 70;
  const stochRsiPeriod: number = 14;
  const stochRsiThreshold: number = 80;
  const trendPeriod: number = 50;

  if (
    data.length < Math.max(longPeriod, rsiPeriod, stochRsiPeriod, trendPeriod)
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

  const latestShortEMA = shortEMA[shortEMA.length - 1];
  const latestLongEMA = longEMA[longEMA.length - 1];
  const latestRSI = rsiValues[rsiValues.length - 1] || 0;
  const latestStochRsiK = stochRsiValues[stochRsiValues.length - 1]?.k || 0;
  const latestTrendEMA = trendEMA[trendEMA.length - 1];
  const latestPrice = data[data.length - 1];

  const isEmaCrossoverSell = latestShortEMA < latestLongEMA;
  const isRsiOverbought = latestRSI > rsiThreshold;
  const isStochRsiOverbought = latestStochRsiK > stochRsiThreshold;
  const isUptrend = latestPrice > latestTrendEMA;
  const isDowntrend = latestPrice < latestTrendEMA;

  logger.info(`Short EMA: ${latestShortEMA}`);
  logger.info(`Long EMA: ${latestLongEMA}`);
  logger.info(`RSI: ${latestRSI}`);
  logger.info(`Stoch RSI: ${latestStochRsiK}`);
  logger.info(`Trend EMA: ${latestTrendEMA}`);
  logger.info(`Latest Price: ${latestPrice}`);
  logger.info(`Trend: ${isDowntrend ? "down" : "up"}`);

  return (
    (isUptrend &&
      isEmaCrossoverSell &&
      isRsiOverbought &&
      isStochRsiOverbought) ||
    isDowntrend
  );
}
