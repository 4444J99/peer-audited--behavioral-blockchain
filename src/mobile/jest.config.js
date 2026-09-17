const path = require("node:path");

// Hoisted testing-library dependencies must use the mobile React instance,
// not the newer React/DOM pair belonging to the independent web workspace.
const reactRoot = path.dirname(require.resolve("react/package.json"));
const reactDomRoot = path.dirname(require.resolve("react-dom/package.json"));

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
    "^react$": require.resolve("react"),
    "^react/(.*)$": `${reactRoot}/$1`,
    "^react-dom$": require.resolve("react-dom"),
    "^react-dom/(.*)$": `${reactDomRoot}/$1`,
    "^@react-native-async-storage/async-storage$":
      "<rootDir>/__mocks__/async-storage.ts",
    "^expo-crypto$": "<rootDir>/__mocks__/expo-crypto.ts",
    "^react-native$": "<rootDir>/__mocks__/react-native.ts",
  },
  // Keep native V8 coverage and all existing coverage thresholds enforcing.
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
