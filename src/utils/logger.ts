import fs from "fs";
import pino from "pino";
import pinoPretty from "pino-pretty";

const errorFile = "./error.log";
const errorFileStream = fs.createWriteStream(errorFile, { flags: "a" });

const debugFile = "./price.log";
const debugFileStream = fs.createWriteStream(debugFile, { flags: "a" });

const streams = [
  {
    level: "debug",
    stream: pinoPretty({
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname",
    }),
  },
  {
    level: "fatal",
    stream: pino.multistream([
      { stream: process.stdout },
      { stream: errorFileStream },
    ]),
  },
  {
    level: "info",
    stream: pino.multistream([{ stream: debugFileStream }]),
  },
];

const logger = pino(
  {
    level: "trace",
  },
  pino.multistream(streams)
);

export default logger;
