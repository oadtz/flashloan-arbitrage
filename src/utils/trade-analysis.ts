interface PivotPoint {
  high: number;
  low: number;
  close: number;
}

function calculatePivotPoints(data: number[]): PivotPoint[] {
  const pivotPoints: PivotPoint[] = [];

  for (let i = 0; i < data.length - 2; i++) {
    const high = Math.max(data[i], data[i + 1], data[i + 2]);
    const low = Math.min(data[i], data[i + 1], data[i + 2]);
    const close = data[i + 2];

    pivotPoints.push({ high, low, close });
  }

  return pivotPoints;
}

export function isSellSignal(data: number[]): { sell: boolean } {
  const pivotPoints = calculatePivotPoints(data);

  if (pivotPoints.length < 2) {
    return { sell: false };
  }

  const lastPivot = pivotPoints[pivotPoints.length - 1];
  const prevPivot = pivotPoints[pivotPoints.length - 2];

  const resistanceLevel =
    (lastPivot.high + lastPivot.low + lastPivot.close) / 3;
  const sell =
    data[data.length - 1] < resistanceLevel &&
    data[data.length - 2] >= resistanceLevel;

  return { sell };
}

export function isBuySignal(data: number[]): { buy: boolean } {
  const pivotPoints = calculatePivotPoints(data);

  if (pivotPoints.length < 2) {
    return { buy: false };
  }

  const lastPivot = pivotPoints[pivotPoints.length - 1];
  const prevPivot = pivotPoints[pivotPoints.length - 2];

  const supportLevel = (lastPivot.high + lastPivot.low + lastPivot.close) / 3;
  const buy =
    data[data.length - 1] > supportLevel &&
    data[data.length - 2] <= supportLevel;

  return { buy };
}
