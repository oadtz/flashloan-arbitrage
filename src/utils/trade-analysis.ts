export function isSellSignal(data: number[]): { sell: boolean } {
  if (data.length < 2) {
    return { sell: false };
  }

  const lastPrice = data[data.length - 1];
  const prevPrice = data[data.length - 2];

  const momentum = lastPrice - prevPrice;

  const sell = momentum < 0;

  return { sell };
}

export function isBuySignal(data: number[]): { buy: boolean } {
  if (data.length < 2) {
    return { buy: false };
  }

  const lastPrice = data[data.length - 1];
  const prevPrice = data[data.length - 2];

  const momentum = lastPrice - prevPrice;

  const buy = momentum > 0;

  return { buy };
}
