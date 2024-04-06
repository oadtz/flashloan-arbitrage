import * as fs from "fs";
import * as readline from "readline";
import { isSellSignal } from "./utils/is-sell-signal";

interface DataPoint {
  price?: number;
}

async function processLineByLine() {
  const fileStream = fs.createReadStream("price.log");

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const prices: number[] = [];

  for await (const line of rl) {
    const data: DataPoint = JSON.parse(line);
    if (data.price !== undefined) {
      if (prices.length > 500) prices.shift();

      prices.push(data.price);
      isSellSignal(prices);
    }
  }
}

processLineByLine();
