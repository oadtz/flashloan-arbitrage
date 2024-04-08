import { SMA } from "technicalindicators";

export function isSellSignal(data: number[]): { sell: boolean } {
  const fastPeriod = 10;
  const slowPeriod = 20;

  if (data.length < slowPeriod) {
    return { sell: false };
  }

  const fastSMA = SMA.calculate({ period: fastPeriod, values: data });
  const slowSMA = SMA.calculate({ period: slowPeriod, values: data });

  const currentFastSMA = fastSMA[fastSMA.length - 1];
  const currentSlowSMA = slowSMA[slowSMA.length - 1];
  const prevFastSMA = fastSMA[fastSMA.length - 2];
  const prevSlowSMA = slowSMA[slowSMA.length - 2];

  // Sell signal: Fast SMA crosses below Slow SMA
  const sellSignal =
    prevFastSMA > prevSlowSMA && currentFastSMA < currentSlowSMA;

  return { sell: sellSignal };
}

export function isBuySignal(data: number[]): { buy: boolean } {
  const fastPeriod = 10;
  const slowPeriod = 20;

  if (data.length < slowPeriod) {
    return { buy: false };
  }

  const fastSMA = SMA.calculate({ period: fastPeriod, values: data });
  const slowSMA = SMA.calculate({ period: slowPeriod, values: data });

  const currentFastSMA = fastSMA[fastSMA.length - 1];
  const currentSlowSMA = slowSMA[slowSMA.length - 1];
  const prevFastSMA = fastSMA[fastSMA.length - 2];
  const prevSlowSMA = slowSMA[slowSMA.length - 2];

  // Buy signal: Fast SMA crosses above Slow SMA
  const buySignal =
    prevFastSMA < prevSlowSMA && currentFastSMA > currentSlowSMA;

  return { buy: buySignal };
}
