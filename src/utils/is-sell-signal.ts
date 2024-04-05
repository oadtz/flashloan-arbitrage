import { EMA, RSI, BollingerBands, MACD } from "technicalindicators";
import logger from "./logger";

export function isSellSignal(data: number[]): boolean {
  const shortPeriod: number = 12;
  const longPeriod: number = 26;
  const rsiPeriod: number = 14;
  const bbPeriod: number = 20;
  const bbStdDev: number = 2;
  const macdFastPeriod: number = 12;
  const macdSlowPeriod: number = 26;
  const macdSignalPeriod: number = 9;
  const supportLevel: number = 0.03; // Adjust this value based on your analysis
  const shortEMAPeriod: number = 10;
  const longEMAPeriod: number = 30;

  logger.info(`Data: ${JSON.stringify(data)}`);
  if (
    data.length <
    Math.max(
      longPeriod,
      rsiPeriod,
      bbPeriod,
      macdSlowPeriod + macdSignalPeriod,
      longEMAPeriod
    )
  ) {
    logger.warn("Insufficient data points for indicator calculations");
    return false;
  }

  const shortEMA = EMA.calculate({ period: shortPeriod, values: data });
  const longEMA = EMA.calculate({ period: longPeriod, values: data });
  const rsiValues = RSI.calculate({ period: rsiPeriod, values: data });
  const bbValues = BollingerBands.calculate({
    period: bbPeriod,
    values: data,
    stdDev: bbStdDev,
  });
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
  const latestBBUpper = bbValues[bbValues.length - 1]?.upper || 0;
  const latestBBLower = bbValues[bbValues.length - 1]?.lower || 0;
  const latestPrice = data[data.length - 1];
  const latestMacd = macdValues[macdValues.length - 1]?.MACD || 0;
  const latestMacdSignal = macdValues[macdValues.length - 1]?.signal || 0;

  const isEmaCrossoverSell = latestShortEMA < latestLongEMA;
  const isRsiOverbought = latestRSI > 70;
  const isPriceNearBBUpper = latestPrice > latestBBUpper * 0.95;
  const isMacdBearishCrossover = latestMacd < latestMacdSignal;

  // Check for potential bullish reversal signals
  const recentRSI = rsiValues.slice(-rsiPeriod);
  const recentPrices = data.slice(-rsiPeriod);
  const isBullishRSIDivergence =
    recentPrices[0] < recentPrices[recentPrices.length - 1] &&
    recentRSI[0] > recentRSI[recentRSI.length - 1];

  const isPriceAtSupport = latestPrice <= supportLevel;

  const shortEMARecent = EMA.calculate({
    period: shortEMAPeriod,
    values: data.slice(-shortEMAPeriod),
  });
  const longEMARecent = EMA.calculate({
    period: longEMAPeriod,
    values: data.slice(-longEMAPeriod),
  });
  const isBullishEMACrossover =
    shortEMARecent[shortEMARecent.length - 1] >
    longEMARecent[longEMARecent.length - 1];

  const isBullishReversal =
    isBullishRSIDivergence || isPriceAtSupport || isBullishEMACrossover;

  logger.info(`Short EMA: ${latestShortEMA}`);
  logger.info(`Long EMA: ${latestLongEMA}`);
  logger.info(`RSI: ${latestRSI}`);
  logger.info(`Bollinger Bands Upper: ${latestBBUpper}`);
  logger.info(`Bollinger Bands Lower: ${latestBBLower}`);
  logger.info(`Latest Price: ${latestPrice}`);
  logger.info(`MACD: ${latestMacd}`);
  logger.info(`MACD Signal: ${latestMacdSignal}`);
  logger.info(`Bullish RSI Divergence: ${isBullishRSIDivergence}`);
  logger.info(`Price at Support: ${isPriceAtSupport}`);
  logger.info(`Bullish EMA Crossover: ${isBullishEMACrossover}`);
  logger.info(`Bullish Reversal: ${isBullishReversal}`);

  return (
    (isEmaCrossoverSell && isRsiOverbought && isPriceNearBBUpper) ||
    (isMacdBearishCrossover && !isBullishReversal)
  );
}
