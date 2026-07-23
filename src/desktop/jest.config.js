const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
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
