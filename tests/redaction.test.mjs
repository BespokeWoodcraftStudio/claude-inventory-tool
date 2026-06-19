import { describe, it, expect } from "vitest";
import { scrubSecrets, redactArgs, redactUrl, looksLikeToken } from "../public/scan.mjs";

// The scanner's secret redaction is the load-bearing privacy guarantee: anything
// it misses ends up in the JSON the user shares. These tests pin its behavior.

describe("looksLikeToken", () => {
  it("flags known credential shapes", () => {
    expect(looksLikeToken("sk-ant-abcdefgh12345678")).toBe(true);
    expect(looksLikeToken("ghp_0123456789abcdefABCDEF")).toBe(true);
    expect(looksLikeToken("xoxb-123456789-abcdef")).toBe(true);
  });

  it("flags long opaque mixed-alphanumeric strings", () => {
    expect(looksLikeToken("A1b2C3d4E5f6G7h8I9j0K1l2")).toBe(true);
  });

  it("does NOT flag package names, semvers, scoped packages, or flags", () => {
    expect(looksLikeToken("playwright")).toBe(false);
    expect(looksLikeToken("4.22.4")).toBe(false);
    expect(looksLikeToken("v1.2.3")).toBe(false);
    expect(looksLikeToken("@brightdata/mcp")).toBe(false);
    expect(looksLikeToken("--no-transcripts")).toBe(false);
    expect(looksLikeToken("")).toBe(false);
  });
});

describe("redactUrl", () => {
  it("redacts userinfo and the query string, keeps the host", () => {
    expect(redactUrl("https://user:pass@api.example.com/path?token=abc")).toBe(
      "https://redacted@api.example.com/path?<redacted>",
    );
  });

  it("redacts token-like path segments (some MCP endpoints key by path)", () => {
    expect(redactUrl("https://mcp.example.com/sse/A1b2C3d4E5f6G7h8I9j0K1l2")).toBe(
      "https://mcp.example.com/sse/<redacted>",
    );
  });

  it("leaves a clean URL alone", () => {
    expect(redactUrl("https://api.ahrefs.com/v3")).toBe("https://api.ahrefs.com/v3");
  });
});

describe("redactArgs", () => {
  it("redacts the value following a secret-introducing flag", () => {
    expect(redactArgs(["--token", "supersecretvalue123"])).toEqual(["--token", "<redacted>"]);
  });

  it("redacts KEY=secret pairs by name", () => {
    expect(redactArgs(["API_KEY=abcdef123456"])).toEqual(["API_KEY=<redacted>"]);
  });

  it("redacts bare tokens and URLs but keeps ordinary args", () => {
    expect(redactArgs(["-y", "@brightdata/mcp"])).toEqual(["-y", "@brightdata/mcp"]);
    expect(redactArgs(["sk-ant-abcdefgh12345678"])).toEqual(["<redacted>"]);
    expect(redactArgs(["https://user:pass@h.com/x"])).toEqual(["https://redacted@h.com/x"]);
  });
});

describe("scrubSecrets", () => {
  it("redacts inline token shapes and labeled secrets", () => {
    expect(scrubSecrets("here is sk-ant-abcdefgh12345678 ok")).toContain("<redacted>");
    expect(scrubSecrets("Authorization: Bearer abc123def456ghi789")).toContain("<redacted>");
  });

  it("leaves clean prose alone", () => {
    expect(scrubSecrets("A normal skill description.")).toBe("A normal skill description.");
  });
});
