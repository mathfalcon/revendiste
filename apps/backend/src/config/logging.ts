export interface LoggingConfig {
  level: string;
  logToFile: boolean;
  logToConsole: boolean;
  logDirectory: string;
}

export const getLoggingConfig = (): LoggingConfig => {
  return {
    level:
      process.env.LOG_LEVEL ||
      (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    logToFile: process.env.LOG_TO_FILE !== 'false',
    logToConsole: process.env.LOG_TO_CONSOLE !== 'false',
    logDirectory: process.env.LOG_DIRECTORY || 'logs',
  };
};
