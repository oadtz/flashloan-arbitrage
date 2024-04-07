import fs from "fs";
import pino from "pino";
import pinoPretty from "pino-pretty";

const errorFile = "./error.log";
const errorFileStream = fs.createWriteStream(errorFile, { flags: "a" });

const debugFile = "./debug.log";
const debugFileStream = fs.createWriteStream(debugFile, { flags: "a" });

const streams = [
  {
    level: "info",
    stream: pinoPretty({
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname",
    }),
  },
  {
    level: "warn",
    stream: pino.multistream([{ stream: debugFileStream }]),
  },
  {
    level: "error",
    stream: pino.multistream([
      { stream: process.stdout },
      { stream: errorFileStream },
    ]),
  },
];

const logger = pino(
  {
    level: "info",
  },
  pino.multistream(streams)
);

export default logger;
