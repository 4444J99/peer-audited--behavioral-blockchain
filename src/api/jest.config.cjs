const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.cjs"],
  transform: {
    ...tsJestTransformCfg,
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  // Use the V8 coverage provider rather than the default "babel" provider.
  // The babel provider instruments via babel-plugin-istanbul → test-exclude,
  // whose minimatch@3 callable API is broken by the repo-wide minimatch>=10
  // override (test-exclude calls minimatch() but v10 exports an object).
  // V8 coverage reads native coverage and sidesteps that chain entirely.
  coverageProvider: "v8",
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 60,
      functions: 60,
      statements: 70,
    },
  },
};
