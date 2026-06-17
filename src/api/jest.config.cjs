const { createDefaultPreset } = require("ts-jest");

// Use a test-only tsconfig (tsconfig.spec.json) so specs that live OUTSIDE the
// app `include` roots — e.g. the migration runner under database/migrations/ —
// compile and actually run, instead of failing with a rootDir/declaration
// error (TS5011) and silently never executing. See issue #28.
const tsJestTransformCfg = createDefaultPreset({
  tsconfig: "<rootDir>/tsconfig.spec.json",
}).transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.cjs"],
  transform: {
    ...tsJestTransformCfg,
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 60,
      functions: 60,
      statements: 70,
    },
  },
};
