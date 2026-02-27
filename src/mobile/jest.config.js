const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        jsx: "react"
      }
    }],
  },
  testPathIgnorePatterns: ["/node_modules/"],
  moduleNameMapper: {
    "^@react-native-async-storage/async-storage$":
      "<rootDir>/__mocks__/async-storage.ts",
    "^react-native$": "<rootDir>/__mocks__/react-native.ts",
  },
  coverageThreshold: {
    global: {
      lines: 50,
      branches: 40,
      functions: 40,
      statements: 50,
    },
  },
};
