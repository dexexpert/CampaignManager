export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/test/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

