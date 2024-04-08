import { SMA, RSI, Stochastic, MACD, ADX } from "technicalindicators";

interface SellSignalResult {
  sell: boolean;
}

const threshold = 0.0005;
/**
 * Identifies optimal sell signals for cryptocurrency tokens based on historical price data.
 *
 * @param data An array of chronological token prices.
 * @param threshold The minimum score threshold for a sell signal to be considered valid.
 * @returns An object indicating whether the current price point is an optimal sell signal.
 */
export function isSellSignal(data: number[]): SellSignalResult {
  // Calculate Simple Moving Averages (SMA) to determine market trend
  const sma50 = SMA.calculate({ period: 50, values: data });
  const sma200 = SMA.calculate({ period: 200, values: data });
  const isBullish = sma50[sma50.length - 1] > sma200[sma200.length - 1];

  // Calculate Relative Strength Index (RSI)
  const rsiPeriod = isBullish ? 14 : 7;
  const rsiThreshold = isBullish ? 75 : 85; // Adjusted RSI thresholds
  const rsi = RSI.calculate({ period: rsiPeriod, values: data });
  const isOverbought = rsi[rsi.length - 1] > rsiThreshold;

  // Calculate Stochastic Oscillator
  const stochasticPeriod = isBullish ? 14 : 7;
  const stochasticThreshold = isBullish ? 85 : 95; // Adjusted Stochastic thresholds
  const stochastic = Stochastic.calculate({
    high: data,
    low: data,
    close: data,
    period: stochasticPeriod,
    signalPeriod: 3,
  });
  const isStochasticOverbought =
    stochastic[stochastic.length - 1]?.k > stochasticThreshold;

  // Calculate Moving Average Convergence Divergence (MACD)
  const macd = MACD.calculate({
    values: data,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const isMacdBearish =
    (macd[macd.length - 1]?.MACD || 0) < (macd[macd.length - 1]?.signal || 0);

  // Calculate Average Directional Index (ADX)
  const adx = ADX.calculate({ high: data, low: data, close: data, period: 14 });
  const isAdxStrong = adx[adx.length - 1]?.adx > 25;

  // Determine sell signal based on technical indicators and market trend
  let isSellSignal =
    (isBullish && isOverbought && isStochasticOverbought && isMacdBearish) ||
    (!isBullish && isMacdBearish && isAdxStrong);

  // Calculate sell signal score
  const sellSignalScore = calculateSellSignalScore(
    data,
    isSellSignal,
    data.length - 1,
    10
  );

  // Update sell signal based on score threshold
  isSellSignal = isSellSignal && sellSignalScore >= threshold;

  return { sell: isSellSignal };
}

/**
 * Identifies optimal buy signals for cryptocurrency tokens based on historical price data.
 *
 * @param data An array of chronological token prices.
 * @returns An object indicating whether the current price point is an optimal buy signal.
 */
export function isBuySignal(data: number[]): BuySignalResult {
  // Calculate Simple Moving Averages (SMA) to determine market trend
  const sma50 = SMA.calculate({ period: 50, values: data });
  const sma200 = SMA.calculate({ period: 200, values: data });
  const isBullish = sma50[sma50.length - 1] > sma200[sma200.length - 1];

  // Calculate Relative Strength Index (RSI)
  const rsiPeriod = isBullish ? 14 : 7;
  const rsiThreshold = isBullish ? 30 : 20; // Adjusted RSI thresholds for buying
  const rsi = RSI.calculate({ period: rsiPeriod, values: data });
  const isOversold = rsi[rsi.length - 1] < rsiThreshold;

  // Calculate Stochastic Oscillator
  const stochasticPeriod = isBullish ? 14 : 7;
  const stochasticThreshold = isBullish ? 20 : 10; // Adjusted Stochastic thresholds for buying
  const stochastic = Stochastic.calculate({
    high: data,
    low: data,
    close: data,
    period: stochasticPeriod,
    signalPeriod: 3,
  });
  const isStochasticOversold =
    stochastic[stochastic.length - 1]?.k < stochasticThreshold;

  // Calculate Moving Average Convergence Divergence (MACD)
  const macd = MACD.calculate({
    values: data,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const isMacdBullish =
    (macd[macd.length - 1]?.MACD || 0) > (macd[macd.length - 1]?.signal || 0);

  // Calculate Average Directional Index (ADX)
  const adx = ADX.calculate({ high: data, low: data, close: data, period: 14 });
  const isAdxStrong = adx[adx.length - 1]?.adx > 25;

  // Determine buy signal based on technical indicators and market trend
  let isBuySignal =
    (isBullish && isOversold && isStochasticOversold && isMacdBullish) ||
    (!isBullish && isMacdBullish && isAdxStrong);

  // Calculate buy signal score
  const buySignalScore = calculateBuySignalScore(
    data,
    isBuySignal,
    data.length - 1,
    10
  );

  // Update buy signal based on score threshold
  isBuySignal = isBuySignal && buySignalScore >= threshold;

  return { buy: isBuySignal };
}

/**
 * Calculates the effectiveness score of a sell signal based on the historical price movement.
 *
 * @param data An array of chronological token prices.
 * @param isSellSignal A boolean indicating if the current price point is a sell signal.
 * @param index The index of the current price point in the data array.
 * @param lookbackPeriod The number of previous price points to consider for score calculation.
 * @returns A score between 0 and 1 representing the effectiveness of the sell signal.
 */
function calculateSellSignalScore(
  data: number[],
  isSellSignal: boolean,
  index: number,
  lookbackPeriod: number
): number {
  if (!isSellSignal || index < lookbackPeriod) {
    return 0;
  }

  const currentPrice = data[index];
  const lookbackData = data.slice(index - lookbackPeriod, index);

  const minLookbackPrice = Math.min(...lookbackData);
  const priceDrop = (currentPrice - minLookbackPrice) / currentPrice;

  // Normalize the score based on the magnitude of the price drop
  const score = Math.max(priceDrop, 0);

  return score;
}
interface BuySignalResult {
  buy: boolean;
}

/**
 * Calculates the effectiveness score of a buy signal based on the historical price movement.
 *
 * @param data An array of chronological token prices.
 * @param isBuySignal A boolean indicating if the current price point is a buy signal.
 * @param index The index of the current price point in the data array.
 * @param lookbackPeriod The number of previous price points to consider for score calculation.
 * @returns A score between 0 and 1 representing the effectiveness of the buy signal.
 */
function calculateBuySignalScore(
  data: number[],
  isBuySignal: boolean,
  index: number,
  lookbackPeriod: number
): number {
  if (!isBuySignal || index < lookbackPeriod) {
    return 0;
  }

  const currentPrice = data[index];
  const lookbackData = data.slice(index - lookbackPeriod, index);

  const maxLookbackPrice = Math.max(...lookbackData);
  const priceRise = (maxLookbackPrice - currentPrice) / currentPrice;

  // Normalize the score based on the magnitude of the price rise
  const score = Math.max(priceRise, 0);

  return score;
}
