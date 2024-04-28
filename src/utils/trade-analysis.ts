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

  if (data.length < 29) {
    const chunkSize = Math.round(29 / data.length);

    for (let i = 0; i < 29; i++) {
      const chunkIndex = Math.floor(i / chunkSize);
      price[i] = data[chunkIndex] ? data[chunkIndex] : data[data.length - 1];
    }
  }

  // const rsi = RSI.calculate({ values: price, period: 14 });
  const macd = MACD.calculate({
    values: price,
    fastPeriod: 9,
    slowPeriod: 21,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  // const macd = MACD.calculate({
  //   values: price,
  //   fastPeriod: 12,
  //   slowPeriod: 26,
  //   signalPeriod: 9,
  //   SimpleMAOscillator: false,
  //   SimpleMASignal: false,
  // });
  // const macd = MACD.calculate({
  //   values: price,
  //   fastPeriod: 26,
  //   slowPeriod: 50,
  //   signalPeriod: 9,
  //   SimpleMAOscillator: false,
  //   SimpleMASignal: false,
  // });
  // const macd = MACD.calculate({
  //   values: price,
  //   fastPeriod: /*price.length < 150 ? 26 :*/ 50,
  //   slowPeriod: /*price.length < 150 ? 50 :*/ 100,
  //   signalPeriod: /*price.length < 150 ? 9 :*/ 12,
  //   SimpleMAOscillator: false,
  //   SimpleMASignal: false,
  // });
  // const ema = EMA.calculate({ period: 50, values: price });
  // const sma = SMA.calculate({ period: 200, values: price });
  // const stochRsi = StochasticRSI.calculate({
  //   values: price,
  //   rsiPeriod: 14,
  //   stochasticPeriod: 14,
  //   kPeriod: 3,
  //   dPeriod: 3,
  // });
  // const stochRsi = StochasticRSI.calculate({
  //   values: price,
  //   rsiPeriod: /*price.length < 323 ? 14 :*/ 75,
  //   stochasticPeriod: /*price.length < 323 ? 14 :*/ 150,
  //   kPeriod: /*price.length < 323 ? 3 :*/ 50,
  //   dPeriod: /*price.length < 323 ? 3 :*/ 50,
  // });
  const stochastic = Stochastic.calculate({
    high: price,
    low: price,
    close: price,
    period: 14,
    signalPeriod: 3,
  });
  // const adx = ADX.calculate({
  //   period: 14,
  //   high: price,
  //   low: price,
  //   close: price,
  // });
  // const bollinger = BollingerBands.calculate({
  //   period: 20,
  //   values: price,
  //   stdDev: 2,
  // });

  const currentPrice = price[price.length - 1];
  // const rsiValue = rsi[rsi.length - 1];
  const macdValue = macd[macd.length - 1]?.MACD || 0;
  const macdSignalValue = macd[macd.length - 1]?.signal || 0;
  const stochasticValueK = stochastic[stochastic.length - 1]?.k || 0;
  const stochasticValueD = stochastic[stochastic.length - 1]?.d || 0;
  // const emaValue = ema[ema.length - 1];
  // const smaValue = sma[sma.length - 1];
  // const stochRsiValueK = stochRsi[stochRsi.length - 1]?.k || 0;
  // const stochRsiValueD = stochRsi[stochRsi.length - 1]?.d || 0;
  // const adxValue = adx[adx.length - 1]?.adx;
  // const adxPreviousValue = adx[adx.length - 2]?.adx;
  // const bollingerUpper = bollinger[bollinger.length - 1]?.upper;
  // const bollingerMiddle = bollinger[bollinger.length - 1]?.middle;
  // const bollingerLower = bollinger[bollinger.length - 1]?.lower;

  const sellSignal =
    macdValue < macdSignalValue &&
    macdSignalValue !== 0 &&
    stochasticValueK < stochasticValueD &&
    //stochasticValueD < 80 &&
    // stochasticValueK < 80 &&
    // currentPrice < bollingerMiddle &&
    //adxValue > 25 &&
    //currentPrice < emaValue &&
    //currentPrice < smaValue &&
    //emaValue < smaValue &&
    //rsiValue < 30 &&
    // stochRsiValueD !== 0 &&
    // stochRsiValueK !== 0 &&
    //macdValue > 0 &&
    // stochRsiValueK < stochRsiValueD &&
    // stochRsiValueD < 20 &&
    // stochRsiValueK < 20 &&
    //currentPrice > bollingerUpper &&
    true;

  return {
    sell: sellSignal,
    indicators: {
      // ema: emaValue,
      // sma: smaValue,
      macd: macdValue,
      macdSignal: macdSignalValue,
      stochasticK: stochasticValueK,
      stochasticD: stochasticValueD,
      // stochRsiK: stochRsiValueK,
      // stochRsiD: stochRsiValueD,
      // adx: adxValue,
      // adxPrevious: adxPreviousValue,
    },
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

  const shortSignal = shortTermSignal < longTermSignal && longTermSignal >= 1;

  return {
    short: shortSignal,
    indicators: {},
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

  const longSignal = shortTermSignal > longTermSignal && longTermSignal <= -1;

  return {
    long: longSignal,
    indicators: {},
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

  const signal =
    (shortTermSignal > longTermSignal && longTermSignal <= 1) ||
    (shortTermSignal < longTermSignal && longTermSignal >= 1);

  return signal;
}
