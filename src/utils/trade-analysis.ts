import { MACD, RSI } from "technicalindicators";

interface SignalResult {
  buy: boolean;
  sell: boolean;
}

export function isSellSignal(data: number[]): SignalResult {
  const macdInput = {
    values: data,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };
  const macd = MACD.calculate(macdInput);
  const lastMacdHistogram = macd[macd.length - 1]?.histogram || 0;

  const rsi = RSI.calculate({ values: data, period: 14 });
  const lastRsi = rsi[rsi.length - 1];

  // Enhanced sell logic with price action
  const sellSignal =
    (lastMacdHistogram < 0 && data[data.length - 1] < data[data.length - 2]) ||
    lastRsi > 70;

  return { sell: sellSignal, buy: false };
}

export function isBuySignal(data: number[]): SignalResult {
  const macdInput = {
    values: data,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };
  const macd = MACD.calculate(macdInput);
  const lastMacdHistogram = macd[macd.length - 1]?.histogram || 0;

  const rsi = RSI.calculate({ values: data, period: 14 });
  const lastRsi = rsi[rsi.length - 1];

  // Enhanced buy logic with price action
  const buySignal =
    (lastMacdHistogram > 0 && data[data.length - 1] > data[data.length - 2]) ||
    lastRsi < 30;

  return { buy: buySignal, sell: false };
}
