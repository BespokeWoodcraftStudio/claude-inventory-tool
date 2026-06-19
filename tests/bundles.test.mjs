import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { collectPluginBundles } from "../public/scan.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let dir;
beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "sc-bundles-"));
  fs.mkdirSync(path.join(dir, "skills", "seo-content"), { recursive: true });
  fs.writeFileSync(path.join(dir, "skills", "seo-content", "SKILL.md"), "# x");
  fs.mkdirSync(path.join(dir, "skills", "not-a-skill"), { recursive: true }); // no SKILL.md → ignored
  fs.mkdirSync(path.join(dir, "agents"), { recursive: true });
  fs.writeFileSync(path.join(dir, "agents", "reviewer.md"), "# a");
  fs.writeFileSync(path.join(dir, ".mcp.json"), JSON.stringify({ mcpServers: { search: {} } }));
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("collectPluginBundles", () => {
  it("enumerates skills (with SKILL.md), agents, and mcp servers", () => {
    expect(collectPluginBundles(dir)).toEqual({
      skills: ["seo-content"], agents: ["reviewer"], mcps: ["search"],
    });
  });

  it("returns undefined for a missing dir", () => {
    expect(collectPluginBundles(path.join(dir, "nope"))).toBeUndefined();
  });
});
