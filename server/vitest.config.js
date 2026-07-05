import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    testTimeout: 300000,
    hookTimeout: 300000,
    fileParallelism: false
  }
});
