import * as fs from "fs";
import * as readline from "readline";
import { isBuySignal, isSellSignal } from "./utils/trade-analysis";

async function processLineByLine() {
  const fileStream = fs.createReadStream("debug.log");
  const writeStream = fs.createWriteStream("simulate.log", { flags: "w" });

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const prices: number[] = [];

  let i = 0;
  for await (const line of rl) {
    const data = JSON.parse(line);

    if (data.price2 !== undefined) {
      try {
        if (prices.length > 500) prices.shift();

        prices.push(data.price2);
        const { sell } = isSellSignal(prices);
        const { buy } = isBuySignal(prices);

        const result = {
          price: data.price2,
          sell,
          buy,
          // ...indicators,
        };

        writeStream.write(`${JSON.stringify(result)}\n`);
      } catch (error) {
        console.error(error);
      }
    }
  }
}

processLineByLine();
