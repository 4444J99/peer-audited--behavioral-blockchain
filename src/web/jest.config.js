const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  watchPathIgnorePatterns: ["<rootDir>/.next/"],
  coverageThreshold: {
    global: {
      lines: 40,
      branches: 30,
      functions: 30,
      statements: 40,
    },
  },
};
