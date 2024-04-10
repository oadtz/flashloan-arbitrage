export function isSellSignal(data: number[]): { sell: boolean } {
  const barUpDnPeriod = 3; // Adjust this value based on your preference

  if (data.length < barUpDnPeriod + 1) {
    return { sell: false };
  }

  const recentData = data.slice(-barUpDnPeriod - 1);
  const barUpDn: number[] = [];

  for (let i = 1; i < recentData.length; i++) {
    const barChange = recentData[i] - recentData[i - 1];
    barUpDn.push(barChange);
  }

  const lastBarUpDn = barUpDn[barUpDn.length - 1];
  const prevBarUpDn = barUpDn[barUpDn.length - 2];
  const isBearishBar = lastBarUpDn < 0;
  const isPrevBarBearish = prevBarUpDn < 0;

  return { sell: isBearishBar && isPrevBarBearish };
}

export function isBuySignal(data: number[]): { buy: boolean } {
  const barUpDnPeriod = 3; // Adjust this value based on your preference

  if (data.length < barUpDnPeriod + 1) {
    return { buy: false };
  }

  const recentData = data.slice(-barUpDnPeriod - 1);
  const barUpDn: number[] = [];

  for (let i = 1; i < recentData.length; i++) {
    const barChange = recentData[i] - recentData[i - 1];
    barUpDn.push(barChange);
  }

  const lastBarUpDn = barUpDn[barUpDn.length - 1];
  const prevBarUpDn = barUpDn[barUpDn.length - 2];
  const isBullishBar = lastBarUpDn > 0;
  const isPrevBarBullish = prevBarUpDn > 0;

  return { buy: isBullishBar && isPrevBarBullish };
}
