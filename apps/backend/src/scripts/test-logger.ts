import {logger} from '../utils';

console.log('Testing Winston Logger with different levels...\n');

// Test different log levels
logger.error('This is an ERROR message');
logger.warn('This is a WARNING message');
logger.info('This is an INFO message');
logger.http('This is an HTTP message');
logger.debug('This is a DEBUG message');

console.log('\n--- Logger Test Complete ---');
console.log('Check the logs directory for file outputs if enabled.');
console.log('Log level is controlled by LOG_LEVEL environment variable.');
console.log('Available levels: error, warn, info, http, debug');
