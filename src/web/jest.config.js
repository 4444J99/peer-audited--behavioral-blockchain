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
  coverageThreshold: {
    global: {
      lines: 40,
      branches: 30,
      functions: 30,
      statements: 40,
    },
  },
};
