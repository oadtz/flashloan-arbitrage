import * as fs from "fs";
import * as readline from "readline";
import { isSellSignal } from "./utils/is-sell-signal";
import logger from "./utils/logger";

interface DataPoint {
  price2?: number;
}

async function processLineByLine() {
  const fileStream = fs.createReadStream("price.log");

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const prices: number[] = [];

  let i = 0;
  for await (const line of rl) {
    const data: DataPoint = JSON.parse(line);
    console.log(i++, data.price2);
    if (data.price2 !== undefined) {
      try {
        if (prices.length > 500) prices.shift();

        prices.push(data.price2);
        const sell = isSellSignal(prices);

        logger.error({
          price: prices[prices.length - 1],
          sell,
        });
      } catch (error) {
        console.error(error);
      }
    }
  }
}

processLineByLine();
