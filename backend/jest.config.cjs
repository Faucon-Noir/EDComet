/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/tests/**/*.test.ts"],
  clearMocks: true,
  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "ED Comet Backend Test Report",
        outputPath: "./coverage/jest-report.html",
        includeFailureMsg: true,
        includeSuiteFailure: true,
      },
    ],
  ],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        diagnostics: false,
      },
    ],
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/routes.ts",
    "!src/scripts/**",
  ],
  coverageReporters: ["text", "lcov", "html", "json-summary"],
};
