import { EMA, RSI, StochasticRSI } from "technicalindicators";
import logger from "./logger";

export function isSellSignal(
  data: number[],
  shortPeriod: number,
  longPeriod: number,
  rsiPeriod: number,
  rsiThreshold: number,
  stochRsiPeriod: number,
  stochRsiThreshold: number
): boolean {
  if (data.length < Math.max(longPeriod, rsiPeriod, stochRsiPeriod)) {
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

  const latestShortEMA = shortEMA[shortEMA.length - 1];
  const latestLongEMA = longEMA[longEMA.length - 1];
  const latestRSI = rsiValues[rsiValues.length - 1] || 0;
  const latestStochRsiK = stochRsiValues[stochRsiValues.length - 1]?.k || 0;

  const isEmaCrossoverSell = latestShortEMA < latestLongEMA;
  const isRsiOverbought = latestRSI > rsiThreshold;
  const isStochRsiOverbought = latestStochRsiK > stochRsiThreshold;

  logger.info(`Short EMA: ${latestShortEMA}`);
  logger.info(`Long EMA: ${latestLongEMA}`);
  logger.info(`RSI: ${latestRSI}`);
  logger.info(`Stoch RSI: ${latestStochRsiK}`);

  return isEmaCrossoverSell && isRsiOverbought && isStochRsiOverbought;
}
