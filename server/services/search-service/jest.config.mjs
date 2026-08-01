// jest for the search service
export default {
  testEnvironment: "node",
  // first run downloads a mongod binary, which is far slower than the 5s default
  testTimeout: 120000,
  transform: {},
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/index.js", "!src/shared/session.js"],
  coverageThreshold: { global: { lines: 20, statements: 20, functions: 15, branches: 10 } },
  coverageReporters: ["text-summary", "lcov"],
};
