import winston from 'winston';
import {getLoggingConfig} from '../config/logging';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Get logging configuration
const config = getLoggingConfig();

// Define different log formats
const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
  // Add colors
  winston.format.colorize({all: true}),
  // Define format of the message showing the timestamp, the level and the message
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports based on configuration
const transports: winston.transport[] = [];

// Add console transport if enabled
if (config.logToConsole) {
  transports.push(new winston.transports.Console());
}

// Add file transports if enabled
if (config.logToFile) {
  // File transport for errors
  transports.push(
    new winston.transports.File({
      filename: `${config.logDirectory}/error.log`,
      level: 'error',
    }),
  );
  // File transport for all logs
  transports.push(
    new winston.transports.File({filename: `${config.logDirectory}/all.log`}),
  );
}

// Create the logger
const logger = winston.createLogger({
  level: config.level,
  levels,
  format,
  transports,
});

// Create a stream object for Morgan (HTTP logging middleware)
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
