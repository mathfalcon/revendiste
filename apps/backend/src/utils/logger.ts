import winston from 'winston';
import TransportStream from 'winston-transport';
import {logs, SeverityNumber} from '@opentelemetry/api-logs';
import {getLoggingConfig} from '../config/logging';

/**
 * Safe JSON stringify that handles circular references
 */
function safeStringify(obj: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (_key, value) => {
    // Handle Error objects specially
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

/**
 * Maps Winston log levels to OpenTelemetry severity numbers.
 */
const WINSTON_TO_OTEL_SEVERITY: Record<string, SeverityNumber> = {
  error: SeverityNumber.ERROR,
  warn: SeverityNumber.WARN,
  info: SeverityNumber.INFO,
  http: SeverityNumber.DEBUG2,
  debug: SeverityNumber.DEBUG,
};

/**
 * Winston transport that forwards log records to OpenTelemetry,
 * which then exports them to PostHog via OTLP.
 */
class OTelTransport extends TransportStream {
  log(info: any, callback: () => void) {
    const otelLogger = logs.getLogger('revendiste-backend');
    const {level, message, timestamp: _ts, ...metadata} = info;

    // Filter out Winston internal properties
    const attributes: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (
        key.startsWith('Symbol(') ||
        key === 'splat' ||
        key === 'level' ||
        key === 'message' ||
        key === 'timestamp'
      ) {
        continue;
      }
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        attributes[key] = value;
      } else if (value !== undefined && value !== null) {
        attributes[key] = safeStringify(value);
      }
    }

    otelLogger.emit({
      severityNumber: WINSTON_TO_OTEL_SEVERITY[level] ?? SeverityNumber.INFO,
      severityText: level,
      body: message,
      attributes,
    });

    callback();
  }
}

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
const shouldColorize = process.env.NODE_ENV === 'local';

const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
  // Handle metadata passed as second argument (e.g., logger.error('msg', {data}))
  winston.format.splat(),
  // Conditionally add colors
  ...(shouldColorize ? [winston.format.colorize({all: true})] : []),
  // Define format of the message showing the timestamp, the level and the message
  winston.format.printf(info => {
    // Extract standard winston properties
    const {timestamp, level, message, ...metadata} = info;

    // Build the base log line
    let logLine = `${timestamp} ${level}: ${message}`;

    // Add metadata if present (when logger is called with a second argument)
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 0) {
      // Filter out winston internal properties
      const cleanMetadata: Record<string, any> = {};
      for (const key of metadataKeys) {
        // Skip winston internal symbols and properties
        if (
          !key.startsWith('Symbol(') &&
          key !== 'splat' &&
          key !== 'level' &&
          key !== 'message' &&
          key !== 'timestamp'
        ) {
          cleanMetadata[key] = metadata[key];
        }
      }

      // Only add metadata if there's actual metadata to show
      if (Object.keys(cleanMetadata).length > 0) {
        logLine += ` ${safeStringify(cleanMetadata)}`;
      }
    }

    return logLine;
  }),
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

// Add OpenTelemetry transport (forwards logs to PostHog via OTLP)
// Only active when OTel SDK is initialized (i.e. POSTHOG_KEY is set)
transports.push(new OTelTransport());

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
