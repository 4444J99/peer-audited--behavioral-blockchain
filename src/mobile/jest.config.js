const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        jsx: "react",
        rootDir: "."
      }
    }],
  },
  testPathIgnorePatterns: ["/node_modules/"],
  moduleNameMapper: {
    "^@react-native-async-storage/async-storage$":
      "<rootDir>/__mocks__/async-storage.ts",
    "^react-native$": "<rootDir>/__mocks__/react-native.ts",
  },
  // V8 coverage provider: the default "babel" provider instruments via
  // babel-plugin-istanbul → test-exclude, whose minimatch@3 callable API is
  // broken by the repo-wide minimatch>=10 override. V8 sidesteps that chain.
  coverageProvider: "v8",
  coverageThreshold: {
    global: {
      lines: 50,
      branches: 40,
      functions: 40,
      statements: 50,
    },
  },
};
