import { configEnv } from "../config/env";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const logLevelMap: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

const currentLogLevel = logLevelMap[configEnv.logLevel] || LogLevel.INFO;

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: string, message: string, meta?: any): string {
  const timestamp = formatTimestamp();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  error: (message: string, meta?: any) => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(formatMessage("error", message, meta));
    }
  },

  warn: (message: string, meta?: any) => {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(formatMessage("warn", message, meta));
    }
  },

  info: (message: string, meta?: any) => {
    if (currentLogLevel >= LogLevel.INFO) {
      console.info(formatMessage("info", message, meta));
    }
  },

  debug: (message: string, meta?: any) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.debug(formatMessage("debug", message, meta));
    }
  },
};

