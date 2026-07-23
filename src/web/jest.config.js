/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          rootDir: ".",
        },
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  watchPathIgnorePatterns: ["<rootDir>/.next/"],
  // V8 coverage provider: the default "babel" provider instruments via
  // babel-plugin-istanbul → test-exclude, whose minimatch@3 callable API is
  // broken by the repo-wide minimatch>=10 override. V8 sidesteps that chain.
  coverageProvider: "v8",
  coverageThreshold: {
    global: {
      lines: 40,
      branches: 30,
      functions: 30,
      statements: 40,
    },
  },
};
