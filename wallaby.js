module.exports = wallaby => {
  return {
    files: [
      "tsconfig.json",
      "**/*.ts",
      "**/*.json",
      "!**/*.test.ts"
    ],

    tests: ["**/*.test.ts"],

    env: {
      type: "node",
      runner: "node",
    },

    testFramework: "jest",
  }
}
