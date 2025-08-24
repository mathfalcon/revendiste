# Logging System

This project uses Winston for structured logging with different log levels and configurable outputs.

## Features

- **Multiple Log Levels**: error, warn, info, http, debug
- **Environment-based Configuration**: Different log levels for development vs production
- **Multiple Outputs**: Console and file logging
- **Structured Format**: Timestamp, level, and message formatting
- **Color-coded Output**: Different colors for different log levels in console

## Log Levels

1. **error** (0): Critical errors that require immediate attention
2. **warn** (1): Warning messages for potential issues
3. **info** (2): General information about application state
4. **http** (3): HTTP request/response logging
5. **debug** (4): Detailed debugging information

## Configuration

The logging system can be configured using environment variables:

```bash
# Log level (default: 'info' in production, 'debug' in development)
LOG_LEVEL=debug

# Enable/disable file logging (default: true)
LOG_TO_FILE=true

# Enable/disable console logging (default: true)
LOG_TO_CONSOLE=true

# Log directory (default: 'logs')
LOG_DIRECTORY=logs
```

## Usage

### Basic Logging

```typescript
import {logger} from '~/utils';

// Different log levels
logger.error('Critical error occurred');
logger.warn('Warning: resource running low');
logger.info('Application started successfully');
logger.http('GET /api/users - 200 OK');
logger.debug('Processing user data:', userData);
```

### In Scraping Services

```typescript
// Info level for important operations
logger.info(`Scraped ${events.length} events from ${platform}`);

// Debug level for detailed parsing information
logger.debug('Parsing date string:', dateString);
logger.debug(`Event crosses midnight: ${totalMinutes} total minutes`);

// Warn level for non-critical issues
logger.warn('Could not parse event date:', dateString);

// Error level for critical failures
logger.error('Error scraping events:', error);
```

### Error Handling

```typescript
try {
  // Some operation
} catch (error) {
  logger.error('Operation failed:', error);
  // Handle error
}
```

## File Output

When file logging is enabled, logs are written to:

- `logs/error.log`: Only error-level messages
- `logs/all.log`: All log messages

## Testing

Test the logger with:

```bash
pnpm test:logger
```

## Best Practices

1. **Use Appropriate Levels**:

   - `error`: For errors that break functionality
   - `warn`: For issues that don't break functionality but need attention
   - `info`: For important application state changes
   - `http`: For HTTP request/response logging
   - `debug`: For detailed debugging information

2. **Structured Messages**:

   - Include relevant context in log messages
   - Use consistent message formats
   - Avoid logging sensitive information

3. **Performance**:

   - Debug logs are automatically disabled in production
   - File logging can be disabled if not needed
   - Console logging can be disabled for headless environments

4. **Environment-specific Logging**:
   - Development: Shows all log levels including debug
   - Production: Shows only info and above by default
   - Customizable via LOG_LEVEL environment variable
