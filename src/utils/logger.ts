import fs from "fs";
import pino from "pino";
import pinoPretty from "pino-pretty";

const logFile = "./error.log";
const logFileStream = fs.createWriteStream(logFile, { flags: "a" });

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
    level: "error",
    stream: pino.multistream([
      { stream: process.stdout },
      { stream: logFileStream },
    ]),
  },
];

const logger = pino(
  {
    level: "debug",
  },
  pino.multistream(streams)
);

export default logger;
