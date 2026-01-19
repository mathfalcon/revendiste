/**
 * Jest test setup file
 *
 * This file runs before each test file.
 * Use it to set up global mocks, test utilities, etc.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Silence console logs during tests to keep output clean
// Comment these out when debugging specific tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'debug').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});
// Keep warn and error visible for debugging
// jest.spyOn(console, 'warn').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});

// Note: clearMocks and restoreMocks are configured in jest.config.js
// No need for manual afterEach cleanup
