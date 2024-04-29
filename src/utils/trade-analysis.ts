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

export function isShortSignal(data: number[]): {
  short: boolean;
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

  const shortSignal = shortTermSignal < longTermSignal && longTermSignal > 0;

  return {
    short: shortSignal,
    indicators: {
      longTermSignal,
      shortTermSignal,
    },
  };
}

export function isLongSignal(data: number[]): {
  long: boolean;
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

  const longSignal = shortTermSignal > longTermSignal && longTermSignal < 0;

  return {
    long: longSignal,
    indicators: {
      longTermSignal,
      shortTermSignal,
    },
  };
}

export function isROISellSignal(data: number[]): boolean {
  const shortTermStoch = MACD.calculate({
    values: data,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const longTermStoch = MACD.calculate({
    values: data,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const shortTermSignal = shortTermStoch[shortTermStoch.length - 1]?.MACD || 0;
  const longTermSignal = longTermStoch[longTermStoch.length - 1]?.signal || 0;

  const signal = shortTermSignal > longTermSignal && longTermSignal < 0;
  //|| (shortTermSignal < longTermSignal && longTermSignal > 0);

  return signal;
}
