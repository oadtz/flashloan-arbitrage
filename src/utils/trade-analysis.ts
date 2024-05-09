import { last } from "lodash";
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

export function isShortSignal(
  price: number[],
  price2: number[]
): {
  short: boolean;
  indicators?: any;
} {
  const bband = BollingerBands.calculate({
    period: 20,
    values: price,
    stdDev: 2,
  });
  const bbandTrend = BollingerBands.calculate({
    period: 20,
    values: price2,
    stdDev: 2,
  });
  const macdLong = MACD.calculate({
    values: price,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const macdTrend = MACD.calculate({
    values: price2.concat([price[price.length - 1]]),
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const lastPrice = price[price.length - 1];
  const bbandSignal = bband[bband.length - 1]?.middle || 0;
  const bbandTrendSignal = bbandTrend[bbandTrend.length - 1]?.middle || 0;
  const shortTermSignal = macdLong[macdLong.length - 1]?.signal || 0;
  const longTermSignal = macdLong[macdLong.length - 1]?.MACD || 0;
  const shortTermTrend = macdTrend[macdTrend.length - 1]?.signal || 0;
  const longTermTrend = macdTrend[macdTrend.length - 1]?.MACD || 0;

  const shortSignal =
    // shortTermTrend < longTermTrend &&
    // lastPrice < bbandTrendSignal &&
    //lastPrice > bbandTrendSignal2 &&
    //longTermTrend < 0 &&
    shortTermSignal < longTermSignal &&
    lastPrice > bbandSignal &&
    longTermSignal >= 0.1;

  return {
    short: shortSignal,
    indicators: {
      bbandSignal,
      longTermSignal,
      shortTermSignal,
      bbandTrendSignal,
      longTermTrend,
      shortTermTrend,
    },
  };
}

export function isLongSignal(
  price: number[],
  price2: number[]
): {
  long: boolean;
  indicators?: any;
} {
  const bband = BollingerBands.calculate({
    period: 20,
    values: price,
    stdDev: 2,
  });
  const bbandTrend = BollingerBands.calculate({
    period: 20,
    values: price2,
    stdDev: 2,
  });
  const macdLong = MACD.calculate({
    values: price,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const macdTrend = MACD.calculate({
    values: price2.concat([price[price.length - 1]]),
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const lastPrice = price[price.length - 1];
  const bbandSignal = bband[bband.length - 1]?.middle || 0;
  const bbandTrendSignal = bbandTrend[bbandTrend.length - 1]?.middle || 0;
  const shortTermSignal = macdLong[macdLong.length - 1]?.signal || 0;
  const longTermSignal = macdLong[macdLong.length - 1]?.MACD || 0;
  const shortTermTrend = macdTrend[macdTrend.length - 1]?.signal || 0;
  const longTermTrend = macdTrend[macdTrend.length - 1]?.MACD || 0;

  const longSignal =
    // shortTermTrend > longTermTrend &&
    // lastPrice > bbandTrendSignal &&
    //lastPrice < bbandTrendSignal2 &&
    //longTermTrend > 0 &&
    shortTermSignal > longTermSignal &&
    lastPrice < bbandSignal &&
    longTermSignal <= -0.1;

  return {
    long: longSignal,
    indicators: {
      bbandSignal,
      longTermSignal,
      shortTermSignal,
      bbandTrendSignal,
      longTermTrend,
      shortTermTrend,
    },
  };
}

export function isROISellSignal(roi: number[]): boolean {
  if (roi.length === 0) return false;
  if (roi[roi.length - 1] < -50) return true;

  let data = [...roi];

  if (roi.length < 33) {
    const chunkSize = Math.round(33 / roi.length);

    for (let i = 0; i < 33; i++) {
      const chunkIndex = Math.floor(i / chunkSize);
      data[i] = roi[chunkIndex] ? roi[chunkIndex] : roi[roi.length - 1];
    }
  }

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
    //lastPrice > bbandSignal &&
    longTermSignal >= 0.75 && // 0.69
    data[data.length - 1] >= 40;
  // || (longTermSignal < shortTermSignal && longTermSignal <= -1);

  return signal;
}
