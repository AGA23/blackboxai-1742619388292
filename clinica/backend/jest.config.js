module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The root directory that Jest should scan for tests and modules
  rootDir: '.',

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/tests/**/*.test.js'
  ],

  // Setup files that will be run before each test
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],

  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: [
    '/node_modules/'
  ],

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    'json',
    'text',
    'lcov',
    'clover'
  ],

  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: [
    'node_modules',
    'src'
  ],

  // A map from regular expressions to module names or to arrays of module names
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Automatically restore mock state between every test
  restoreMocks: true,

  // The test environment specific configuration
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // A list of paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>/src'
  ],

  // Stop running tests after `n` failures
  bail: 5,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!**/node_modules/**'
  ],

  // The number of seconds after which a test is considered as slow and reported as such in the results
  slowTestThreshold: 5,

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFiles: [],

  // Force coverage collection from ignored files using an array of glob patterns
  forceCoverageMatch: [],

  // A path to a module which exports an async function that is triggered once before all test suites
  globalSetup: undefined,

  // A path to a module which exports an async function that is triggered once after all test suites
  globalTeardown: undefined,

  // The glob patterns Jest uses to detect test files
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$'
};