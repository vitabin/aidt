import { LoggerOptions, createLogger, format, transports } from 'winston';

// custom log display format
const customFormat = format.printf(({ level, stack, message }) => {
  return `${new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })} - [${level.toUpperCase().padEnd(5)}] - ${stack || message}`;
});

// for development environment
const devLogger: LoggerOptions = {
  format: format.combine(customFormat, format.colorize({ all: true, colors: { info: 'cyan', error: 'yellow', fatal: 'red' } })),
  transports: [new transports.Console()],
};

// for production environment
const prodLogger: LoggerOptions = {
  format: format.combine(customFormat, format.colorize({ all: true, colors: { info: 'cyan', error: 'yellow', fatal: 'red' }, level: true, message: true })),
  transports: [
    new transports.Console({
      level: 'info',
    }),
    new transports.Console({
      level: 'error',
    }),
    new transports.Console({
      level: 'fatal',
    }),
  ],
};

// export log instance based on the current environment
const instanceLogger = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;

export const instance = createLogger(instanceLogger);
