import {
  RSI,
  MACD,
  EMA,
  SMA,
  StochasticRSI,
  ADX,
  BollingerBands,
} from "technicalindicators";

export function isSellSignal(data: number[]): {
  sell: boolean;
  indicators?: any;
} {
  let price = [...data];

  if (data.length < 111) {
    const chunkSize = Math.round(111 / data.length);

    for (let i = 0; i < 111; i++) {
      const chunkIndex = Math.floor(i / chunkSize);
      price[i] = data[chunkIndex] ? data[chunkIndex] : data[data.length - 1];
    }
  }

  const rsi = RSI.calculate({ values: price, period: 14 });
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
  const ema = EMA.calculate({ period: 50, values: price });
  const sma = SMA.calculate({ period: 200, values: price });
  const stochRsi = StochasticRSI.calculate({
    values: price,
    rsiPeriod: 14,
    stochasticPeriod: 14,
    kPeriod: 3,
    dPeriod: 3,
  });
  // const stochRsi = StochasticRSI.calculate({
  //   values: price,
  //   rsiPeriod: /*price.length < 323 ? 14 :*/ 75,
  //   stochasticPeriod: /*price.length < 323 ? 14 :*/ 150,
  //   kPeriod: /*price.length < 323 ? 3 :*/ 50,
  //   dPeriod: /*price.length < 323 ? 3 :*/ 50,
  // });
  const adx = ADX.calculate({
    period: 14,
    high: price,
    low: price,
    close: price,
  });
  const bollinger = BollingerBands.calculate({
    period: 20,
    values: price,
    stdDev: 2,
  });

  const currentPrice = price[price.length - 1];
  const rsiValue = rsi[rsi.length - 1];
  const macdValue = macd[macd.length - 1]?.MACD || 0;
  const macdSignalValue = macd[macd.length - 1]?.signal || 0;
  const emaValue = ema[ema.length - 1];
  const smaValue = sma[sma.length - 1];
  const stochRsiValueK = stochRsi[stochRsi.length - 1]?.k || 0;
  const stochRsiValueD = stochRsi[stochRsi.length - 1]?.d || 0;
  const adxValue = adx[adx.length - 1]?.adx;
  const bollingerUpper = bollinger[bollinger.length - 1]?.upper;
  const bollingerMiddle = bollinger[bollinger.length - 1]?.middle;

  const sellSignal =
    //currentPrice < emaValue &&
    //currentPrice < smaValue &&
    //rsiValue > 70 &&
    macdValue < macdSignalValue &&
    //macdValue > 0 &&
    // stochRsiValueK < stochRsiValueD &&
    // stochRsiValueD > 70 &&
    // stochRsiValueK > 70 &&
    //adxValue > 25 &&
    //currentPrice > bollingerUpper &&
    true;

  return {
    sell: sellSignal,
    indicators: {
      macd: macdValue,
      macdSignal: macdSignalValue,
      stochRsiK: stochRsiValueK,
      stochRsiD: stochRsiValueD,
    },
  };
}
