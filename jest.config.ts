import type { Config } from "jest";

// Add any custom config to be passed to Jest
const config: Config = {
    coverageProvider: "v8",
    testEnvironment: "jest-environment-jsdom",
    // Add more setup options before each test is run
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    preset: "ts-jest",
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
};

export default config;
