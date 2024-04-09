import { MACD, RSI } from "technicalindicators";

interface SignalResult {
  buy?: boolean;
  sell?: boolean;
}

let lastSignal: "buy" | "sell" | null = null;
let lastSignalTime: number = Date.now(); // Track the last signal time for cooldown

function isTrending(
  data: number[],
  threshold: number = 0.02
): "up" | "down" | "sideways" {
  let upMoves = 0;
  let downMoves = 0;
  for (let i = data.length - 4; i < data.length - 1; i++) {
    let percentageChange = (data[i + 1] - data[i]) / data[i];
    if (percentageChange > threshold) upMoves++;
    if (percentageChange < -threshold) downMoves++;
  }

  if (upMoves >= 2) return "up";
  if (downMoves >= 2) return "down";
  return "sideways";
}

export function isSellSignal(data: number[]): SignalResult {
  const macdInput = {
    values: data,
    fastPeriod: 13, // Slightly reduced
    slowPeriod: 28, // Slightly reduced
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };
  const macd = MACD.calculate(macdInput);
  const lastMacdHistogram = macd[macd.length - 1]?.histogram || 0;

  const rsi = RSI.calculate({ values: data, period: 13 }); // Slightly reduced
  const lastRsi = rsi[rsi.length - 1];

  // Refined sell logic with adjusted trend detection
  const trend = isTrending(data);
  const sellSignal =
    (lastMacdHistogram < 0 && trend === "down") || lastRsi > 70;

  if (sellSignal) {
    // Additional check for decreasing price velocity before confirming sell
    const recentPrices = data.slice(-5); // Last 5 prices
    let decreasingVelocity = true;
    for (let i = 1; i < recentPrices.length; i++) {
      if (
        recentPrices[i] - recentPrices[i - 1] >=
        recentPrices[i - 1] - recentPrices[i - 2]
      ) {
        decreasingVelocity = false;
        break;
      }
    }

    if (decreasingVelocity) {
      lastSignal = "sell";
      lastSignalTime = Date.now();
      return { sell: true };
    }
  }
  return { sell: false };
}

export function isBuySignal(data: number[]): SignalResult {
  const macdInput = {
    values: data,
    fastPeriod: 13, // Slightly reduced
    slowPeriod: 28, // Slightly reduced
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };
  const macd = MACD.calculate(macdInput);
  const lastMacdHistogram = macd[macd.length - 1]?.histogram || 0;

  const rsi = RSI.calculate({ values: data, period: 13 }); // Slightly reduced
  const lastRsi = rsi[rsi.length - 1];

  // Refined buy logic with adjusted trend detection
  const trend = isTrending(data);
  const buySignal = (lastMacdHistogram > 0 && trend === "up") || lastRsi < 30;
  if (buySignal) {
    lastSignal = "buy";
    lastSignalTime = Date.now();
    return { buy: true };
  }
  return { buy: false };
}
