import {
  RSI,
  MACD,
  EMA,
  SMA,
  StochasticRSI,
  Stochastic,
  ADX,
  BollingerBands,
} from "technicalindicators";

export function isSellSignal(data: number[]): {
  sell: boolean;
  indicators?: any;
} {
  let price = [...data];

  // if (data.length < 29) {
  //   const chunkSize = Math.round(29 / data.length);

  //   for (let i = 0; i < 29; i++) {
  //     const chunkIndex = Math.floor(i / chunkSize);
  //     price[i] = data[chunkIndex] ? data[chunkIndex] : data[data.length - 1];
  //   }
  // }

  const shortTermStoch = MACD.calculate({
    values: price,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const longTermStoch = MACD.calculate({
    values: price,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const shortTermSignal = shortTermStoch[shortTermStoch.length - 1]?.MACD || 0;
  const longTermSignal = longTermStoch[longTermStoch.length - 1]?.signal || 0;

  const sellSignal = shortTermSignal < longTermSignal && longTermSignal > 0;

  return {
    sell: sellSignal,
    indicators: {},
  };
}

export function isShortSignal(price: number[]): {
  short: boolean;
  indicators?: any;
} {
  const shortTermPrices = price.filter((_, i) => i % 1 === 0);
  const midTermPrices = price.filter((_, i) => i % 6 === 0);
  const longTermPrices = price.filter((_, i) => i % 12 === 0);

  const shortTermIndicator = MACD.calculate({
    values: shortTermPrices,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const midTermIndicator = MACD.calculate({
    values: midTermPrices,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const longTermIndicator = MACD.calculate({
    values: longTermPrices,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const shortTermMACD =
    shortTermIndicator[shortTermIndicator.length - 1]?.MACD || 0;
  const shortTermSignal =
    shortTermIndicator[shortTermIndicator.length - 1]?.signal || 0;
  const midTermMACD = midTermIndicator[midTermIndicator.length - 1]?.MACD || 0;
  const midTermSignal =
    midTermIndicator[midTermIndicator.length - 1]?.signal || 0;
  const longTermMACD =
    longTermIndicator[longTermIndicator.length - 1]?.MACD || 0;
  const longTermSignal =
    longTermIndicator[longTermIndicator.length - 1]?.signal || 0;

  const shortSignal =
    shortTermMACD < shortTermSignal &&
    midTermMACD < midTermSignal &&
    longTermMACD < longTermSignal;

  return {
    short: shortSignal,
    indicators: {
      longTermSignal,
      shortTermSignal,
    },
  };
}

export function isLongSignal(price: number[]): {
  long: boolean;
  indicators?: any;
} {
  const shortTermPrices = price.filter((_, i) => i % 1 === 0);
  const midTermPrices = price.filter((_, i) => i % 6 === 0);
  const longTermPrices = price.filter((_, i) => i % 12 === 0);

  const shortTermIndicator = MACD.calculate({
    values: shortTermPrices,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const midTermIndicator = MACD.calculate({
    values: midTermPrices,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const longTermIndicator = MACD.calculate({
    values: longTermPrices,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const shortTermMACD =
    shortTermIndicator[shortTermIndicator.length - 1]?.MACD || 0;
  const shortTermSignal =
    shortTermIndicator[shortTermIndicator.length - 1]?.signal || 0;
  const midTermMACD = midTermIndicator[midTermIndicator.length - 1]?.MACD || 0;
  const midTermSignal =
    midTermIndicator[midTermIndicator.length - 1]?.signal || 0;
  const longTermMACD =
    longTermIndicator[longTermIndicator.length - 1]?.MACD || 0;
  const longTermSignal =
    longTermIndicator[longTermIndicator.length - 1]?.signal || 0;

  const longSignal =
    shortTermMACD > shortTermSignal &&
    midTermMACD > midTermSignal &&
    longTermMACD > longTermSignal;

  return {
    long: longSignal,
    indicators: {
      longTermSignal,
      shortTermSignal,
    },
  };
}

export function isROISellSignal(data: number[]): boolean {
  if (data.length === 0) return false;
  if (data[data.length - 1] < -10) return true;

  const shortTermStoch = MACD.calculate({
    values: data,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const longTermStoch = MACD.calculate({
    values: data,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const shortTermSignal =
    shortTermStoch[shortTermStoch.length - 1]?.signal || 0;
  const longTermSignal = longTermStoch[longTermStoch.length - 1]?.MACD || 0;

  console.log("ROI Long Term Signal: ", longTermSignal);
  console.log("ROI Short Term Signal: ", shortTermSignal);

  const signal =
    (longTermSignal > shortTermSignal &&
      longTermSignal >= 2 &&
      data[data.length - 1] >= 10) ||
    (longTermSignal < shortTermSignal && longTermSignal <= -1);

  return signal;
}
