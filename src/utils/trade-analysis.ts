function calculateSMA(data: number[], period: number): number {
  const sum = data.slice(-period).reduce((acc, val) => acc + val, 0);
  return sum / period;
}

function calculateStandardDeviation(data: number[], period: number): number {
  const sma = calculateSMA(data, period);
  const sumSquaredDifferences = data
    .slice(-period)
    .reduce((acc, val) => acc + Math.pow(val - sma, 2), 0);
  return Math.sqrt(sumSquaredDifferences / period);
}

export function isSellSignal(data: number[]): { sell: boolean } {
  const period = 20; // Adjust this value based on your preference
  const stdDevMultiplier = 2; // Adjust this value based on your preference

  if (data.length < period) {
    return { sell: false };
  }

  const sma = calculateSMA(data, period);
  const stdDev = calculateStandardDeviation(data, period);
  const upperBand = sma + stdDevMultiplier * stdDev;
  const lowerBand = sma - stdDevMultiplier * stdDev;

  const lastPrice = data[data.length - 1];
  const prevPrice = data[data.length - 2];
  const isPriceAboveUpperBand = lastPrice > upperBand;
  const wasPrevPriceAboveUpperBand = prevPrice > upperBand;

  return { sell: isPriceAboveUpperBand && !wasPrevPriceAboveUpperBand };
}

export function isBuySignal(data: number[]): { buy: boolean } {
  const period = 20; // Adjust this value based on your preference
  const stdDevMultiplier = 2; // Adjust this value based on your preference

  if (data.length < period) {
    return { buy: false };
  }

  const sma = calculateSMA(data, period);
  const stdDev = calculateStandardDeviation(data, period);
  const upperBand = sma + stdDevMultiplier * stdDev;
  const lowerBand = sma - stdDevMultiplier * stdDev;

  const lastPrice = data[data.length - 1];
  const prevPrice = data[data.length - 2];
  const isPriceBelowLowerBand = lastPrice < lowerBand;
  const wasPrevPriceBelowLowerBand = prevPrice < lowerBand;

  return { buy: isPriceBelowLowerBand && !wasPrevPriceBelowLowerBand };
}
