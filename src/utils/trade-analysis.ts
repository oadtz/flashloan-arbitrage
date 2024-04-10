function calculateSupertrend(
  data: number[],
  period: number,
  multiplier: number
): number[] {
  const atr = calculateATR(data, period);
  const upperBand: number[] = [];
  const lowerBand: number[] = [];
  const supertrend: number[] = [];
  let prevUpperBand = 0;
  let prevLowerBand = 0;
  let prevSupertrend = 0;

  for (let i = period; i < data.length; i++) {
    const upperLine = (data[i] + data[i - 1]) / 2 + multiplier * atr[i];
    const lowerLine = (data[i] + data[i - 1]) / 2 - multiplier * atr[i];

    upperBand.push(upperLine);
    lowerBand.push(lowerLine);

    if (i === period) {
      supertrend.push(data[i] > upperLine ? upperLine : lowerLine);
    } else {
      if (prevSupertrend === prevUpperBand && data[i] < upperLine) {
        supertrend.push(upperLine);
      } else if (prevSupertrend === prevUpperBand && data[i] > upperLine) {
        supertrend.push(lowerLine);
      } else if (prevSupertrend === prevLowerBand && data[i] > lowerLine) {
        supertrend.push(lowerLine);
      } else if (prevSupertrend === prevLowerBand && data[i] < lowerLine) {
        supertrend.push(upperLine);
      } else {
        supertrend.push(prevSupertrend);
      }
    }

    prevUpperBand = upperLine;
    prevLowerBand = lowerLine;
    prevSupertrend = supertrend[supertrend.length - 1];
  }

  return supertrend;
}

function calculateATR(data: number[], period: number): number[] {
  const atr: number[] = [];
  let prevClose = data[0];
  let sum = 0;

  for (let i = 1; i < data.length; i++) {
    const high = Math.max(data[i], prevClose);
    const low = Math.min(data[i], prevClose);
    const tr = high - low;
    sum += tr;

    if (i < period) {
      atr.push(0);
    } else if (i === period) {
      atr.push(sum / period);
    } else {
      atr.push((atr[atr.length - 1] * (period - 1) + tr) / period);
    }

    prevClose = data[i];
  }

  return atr;
}

export function isSellSignal(data: number[]): { sell: boolean } {
  const period = 10;
  const multiplier = 3;

  if (data.length < period) {
    return { sell: false };
  }

  const supertrend = calculateSupertrend(data, period, multiplier);
  const lastIndex = supertrend.length - 1;
  const sell = data[lastIndex] < supertrend[lastIndex];

  return { sell };
}

export function isBuySignal(data: number[]): { buy: boolean } {
  const period = 10;
  const multiplier = 3;

  if (data.length < period) {
    return { buy: false };
  }

  const supertrend = calculateSupertrend(data, period, multiplier);
  const lastIndex = supertrend.length - 1;
  const buy = data[lastIndex] > supertrend[lastIndex];

  return { buy };
}
