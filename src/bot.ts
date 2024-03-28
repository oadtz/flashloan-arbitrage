import * as ccxt from "ccxt";

interface Ticker {
  ask: number;
  bid: number;
}

interface Opportunity {
  exchange1: string;
  exchange2: string;
  symbol: string;
  profit: number;
}

const exchanges = [
  new ccxt.binance(),
  new ccxt.kraken(),
  new ccxt.bitfinex(),
  new ccxt.coinbasepro(),
  new ccxt.bitmex(),
  new ccxt.poloniex(),
  new ccxt.kucoin(),
];

const symbols = [
  "BTC/USDT",
  "ETH/USDT",
  "XRP/USDT",
  "BCH/USDT",
  "LTC/USDT",
  "EOS/USDT",
  "BNB/USDT",
  "XLM/USDT",
  "ADA/USDT",
  "XMR/USDT",
  "DASH/USDT",
  "TRX/USDT",
  "LINK/USDT",
  "XTZ/USDT",
  "NEO/USDT",
];
const threshold = 0.01; // 1% profit threshold

async function fetchTickers(
  exchange: ccxt.Exchange,
  symbol: string
): Promise<Ticker> {
  const ticker = await exchange.fetchTicker(symbol);
  return {
    ask: ticker.ask || 0,
    bid: ticker.bid || 0,
  };
}

async function findOpportunities(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = [];

  for (const symbol of symbols) {
    const tickers: Record<string, Ticker> = {};

    for (const exchange of exchanges) {
      const ticker = await fetchTickers(exchange, symbol);
      tickers[exchange.id] = ticker;
    }

    for (const [exchange1, ticker1] of Object.entries(tickers)) {
      for (const [exchange2, ticker2] of Object.entries(tickers)) {
        if (exchange1 !== exchange2) {
          const profit = (ticker2.bid - ticker1.ask) / ticker1.ask;
          if (profit > threshold) {
            opportunities.push({
              exchange1,
              exchange2,
              symbol,
              profit,
            });
          }
        }
      }
    }
  }

  return opportunities;
}

async function main() {
  while (true) {
    try {
      const opportunities = await findOpportunities();
      if (opportunities.length > 0) {
        console.log("Arbitrage opportunities found:");
        opportunities.forEach((opportunity) => {
          console.log(
            `Exchange1: ${opportunity.exchange1}, Exchange2: ${
              opportunity.exchange2
            }, Symbol: ${
              opportunity.symbol
            }, Profit: ${opportunity.profit.toFixed(4)}`
          );
        });
      } else {
        console.log("No arbitrage opportunities found.");
      }
    } catch (error) {
      console.error("Error:", error);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before the next iteration
  }
}

main();
