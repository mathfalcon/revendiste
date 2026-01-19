/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  // Ignore factory files (not tests)
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/factories/'],
  moduleNameMapper: {
    '^~\\/(.*)$': '<rootDir>/src/$1',
    '^@revendiste/shared$': '<rootDir>/../../packages/shared/src',
    '^@revendiste/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@revendiste/transactional$': '<rootDir>/../../packages/transactional/src',
    '^@revendiste/transactional/(.*)$':
      '<rootDir>/../../packages/transactional/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  // Collect coverage from source files
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/routes.ts',
    '!src/swagger/**',
    '!src/__tests__/**',
  ],
  // Ignore node_modules except for workspace packages
  transformIgnorePatterns: ['/node_modules/(?!@revendiste)'],
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  // Test timeout
  testTimeout: 10000,
  // Verbose output
  verbose: true,
  // Clear mocks between tests automatically
  clearMocks: true,
  // Restore mocks after each test
  restoreMocks: true,
};
