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
  const bband = BollingerBands.calculate({
    period: 20,
    values: price,
    stdDev: 2,
  });
  const macdShort = MACD.calculate({
    values: price,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const macdLong = MACD.calculate({
    values: price,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const lastPrice = price[price.length - 1];
  const bbandSignal = bband[bband.length - 1]?.upper || 0;
  const shortTermSignal = macdLong[macdLong.length - 1]?.signal || 0;
  const longTermSignal = macdLong[macdLong.length - 1]?.MACD || 0;

  const shortSignal =
    shortTermSignal < longTermSignal &&
    lastPrice > bbandSignal &&
    longTermSignal >= 0.8;

  return {
    short: shortSignal,
    indicators: {
      bbandSignal,
      longTermSignal,
      shortTermSignal,
    },
  };
}

export function isLongSignal(price: number[]): {
  long: boolean;
  indicators?: any;
} {
  const bband = BollingerBands.calculate({
    period: 20,
    values: price,
    stdDev: 2,
  });
  const macdShort = MACD.calculate({
    values: price,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const macdLong = MACD.calculate({
    values: price,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const lastPrice = price[price.length - 1];
  const bbandSignal = bband[bband.length - 1]?.lower || 0;
  const shortTermSignal = macdShort[macdShort.length - 1]?.MACD || 0;
  const longTermSignal = macdLong[macdLong.length - 1]?.MACD || 0;

  const longSignal =
    shortTermSignal > longTermSignal &&
    lastPrice < bbandSignal &&
    longTermSignal <= -0.8;

  return {
    long: longSignal,
    indicators: {
      bbandSignal,
      longTermSignal,
      shortTermSignal,
    },
  };
}

export function isROISellSignal(data: number[]): boolean {
  if (data.length === 0) return false;
  if (data[data.length - 1] < -50) return true;

  const bband = BollingerBands.calculate({
    period: 20,
    values: data,
    stdDev: 2,
  });
  const macdShort = MACD.calculate({
    values: data,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const macdLong = MACD.calculate({
    values: data,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const lastPrice = data[data.length - 1];
  const bbandSignal = bband[bband.length - 1]?.upper || 0;
  const shortTermSignal = macdLong[macdLong.length - 1]?.signal || 0;
  const longTermSignal = macdLong[macdLong.length - 1]?.MACD || 0;

  console.log("ROI Long Term Signal: ", longTermSignal);
  console.log("ROI Short Term Signal: ", shortTermSignal);

  const signal =
    longTermSignal > shortTermSignal &&
    lastPrice > bbandSignal &&
    longTermSignal >= 2 &&
    data[data.length - 1] >= 10;
  // || (longTermSignal < shortTermSignal && longTermSignal <= -1);

  return signal;
}
