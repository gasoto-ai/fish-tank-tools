import type { Config } from "jest"

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@octokit/(.*)$": "<rootDir>/src/__mocks__/@octokit/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/app/api/**/*.ts",
    "src/lib/**/*.ts",
    "!src/lib/db.ts",
  ],
}

export default config
