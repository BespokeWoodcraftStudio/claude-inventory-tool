import { defineConfig } from "vitest/config";

// Tests exercise pure logic only (scanner redaction + label disambiguation and
// the in-browser inventory parser), so a plain Node environment is all we need.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,mts,mjs}"],
  },
});
