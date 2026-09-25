/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/tests/**/**/*.test.ts"],
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
        tsconfig: "./tsconfig.test.json",
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
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
