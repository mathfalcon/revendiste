const baseConfig = require('./jest.config');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...baseConfig,
  testMatch: ['**/__tests__/integration/**/*.integration.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/factories/'],
  testTimeout: 180000,
};
