#!/usr/bin/env node
// =============================================================
// Claude Inventory Tool — local scan
//
//   curl -fsSL https://claude-inventory-tool.vercel.app/scan.mjs | node
//   # or:  node scan.mjs            (writes ./claude-inventory.json)
//          node scan.mjs --stdout   (prints JSON to stdout instead)
//
// Reads your local Claude Code install and writes a single JSON file
// describing every skill, plugin, MCP server, and agent you have — split
// by global (~/.claude) vs. project (each repo's .claude). Drop that file
// into the web app to see and organize everything.
//
// PRIVACY: this runs entirely on your machine. It never sends anything
// anywhere. Secrets are aggressively redacted before they ever touch the
// output file: MCP env values, auth headers, tokens, and URL credentials
// are replaced with "<redacted>". Your home directory is rewritten to "~".
// One thing it does NOT scrub: skill/agent descriptions are copied as-is from
// their frontmatter, so don't keep secrets in a SKILL.md description.
// Read this file before you run it — it's short and has no dependencies.
//
// SPDX-License-Identifier: MIT
// =============================================================

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SCHEMA_VERSION = 1;
const GENERATOR = "scan.mjs@1.0.0";
const HOME = os.homedir();
const CLAUDE = path.join(HOME, ".claude");

const args = new Set(process.argv.slice(2));
const TO_STDOUT = args.has("--stdout");
const OUT_FILE = path.resolve(process.cwd(), "claude-inventory.json");

// ---------- small helpers ----------
const tilde = (p) => (p && p.startsWith(HOME) ? "~" + p.slice(HOME.length) : p);
const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const readText = (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return null; } };
const readJSON = (p) => { const t = readText(p); if (!t) return null; try { return JSON.parse(t); } catch { return null; } };
const listDir = (p, kind) => {
  try {
    return fs.readdirSync(p, { withFileTypes: true })
      .filter((d) => (kind === "dir" ? d.isDirectory() : d.isFile()))
      .map((d) => d.name);
  } catch { return []; }
};

// Pull `name:` and `description:` out of YAML-ish frontmatter without a YAML dep.
function parseFrontmatter(text) {
  if (!text) return {};
  const m = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[kv[1]] = v;
  }
  return out;
}

// ---------- secret redaction ----------
const SECRET_HINT = /(key|token|secret|password|passwd|auth|bearer|credential|api[_-]?key|client[_-]?secret)/i;
// A long opaque string that looks like a credential rather than a flag/package.
const LOOKS_SECRET = /^(?:[A-Za-z0-9._\-]{24,}|sk-[A-Za-z0-9._\-]+|gh[pousr]_[A-Za-z0-9]+|xox[baprs]-[A-Za-z0-9-]+)$/;

// A KEY=value pair whose key names a secret (e.g. API_KEY=…, auth-token=…).
const SECRET_KV = /^[A-Za-z0-9_.-]*(?:key|token|secret|password|passwd|auth|bearer|credential)[A-Za-z0-9_.-]*=.+/i;

function redactArgs(argv) {
  if (!Array.isArray(argv)) return argv;
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    const a = String(argv[i]);
    const prev = i > 0 ? String(argv[i - 1]) : "";
    // Redact the value that follows a secret-introducing token (a flag like
    // --token, or a bare label like "password"). Don't redact another flag.
    if (prev && SECRET_HINT.test(prev) && !/^-/.test(a) && !SECRET_HINT.test(a)) {
      out.push("<redacted>"); continue;
    }
    // KEY=value where the key names a secret (flag or positional form).
    if (SECRET_KV.test(a)) { out.push(a.split("=")[0] + "=<redacted>"); continue; }
    // A URL / connection string carrying credentials or a query string.
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(a)) {
      try { const u = new URL(a); if (u.username || u.password || u.search) { out.push(redactUrl(a)); continue; } }
      catch { /* not a URL */ }
    }
    if (LOOKS_SECRET.test(a)) { out.push("<redacted>"); continue; }
    // A bare opaque token: 18+ mixed letters+digits in a single run (no path,
    // scope, or version shape). Catches tokens/UUIDs/keys passed positionally
    // without redacting package names ("playwright"), semvers ("4.22.4"), or
    // scoped packages ("@scope/pkg").
    if (a.length >= 18 && /^[A-Za-z0-9._-]+$/.test(a) && /[A-Za-z]/.test(a) && /[0-9]/.test(a)
        && !/^v?\d+\.\d+/.test(a) && !a.includes("..")) {
      out.push("<redacted>"); continue;
    }
    // Rewrite absolute home paths so usernames don't leak in args.
    out.push(a.startsWith(HOME) ? tilde(a) : a);
  }
  return out;
}

function redactUrl(u) {
  try {
    const url = new URL(String(u));
    if (url.username || url.password) { url.username = "redacted"; url.password = ""; }
    if (url.search) url.search = "?<redacted>";
    return url.toString();
  } catch { return String(u).replace(/([?&][^=]+=)[^&]+/g, "$1<redacted>"); }
}

function redactRecord(obj) {
  if (!obj || typeof obj !== "object") return undefined;
  const out = {};
  for (const k of Object.keys(obj)) out[k] = "<redacted>";
  return Object.keys(out).length ? out : undefined;
}

// Turn one MCP server config into a safe, human-readable summary.
function summarizeMcp(name, cfg) {
  if (!cfg || typeof cfg !== "object") return { transport: "unknown" };
  const out = {};
  const type = cfg.type || (cfg.url ? "http" : cfg.command ? "stdio" : "unknown");
  out.transport = type;
  if (cfg.command) {
    out.command = cfg.command;
    out.args = redactArgs(cfg.args);
  }
  if (cfg.url) out.url = redactUrl(cfg.url);
  const env = redactRecord(cfg.env);
  if (env) out.env = env;
  const headers = redactRecord(cfg.headers);
  if (headers) out.headers = headers;
  return out;
}

// A short, readable label for an MCP source line.
function mcpSourceLabel(summary) {
  if (summary.url) { try { return new URL(summary.url).host; } catch { return summary.transport; } }
  if (summary.command) return [summary.command, ...(summary.args || [])].join(" ").slice(0, 60);
  return summary.transport;
}

// A one-line description for an MCP server (no secrets — summary is pre-redacted).
function mcpDescription(summary) {
  if (summary.url) { try { return `${summary.transport.toUpperCase()} MCP at ${new URL(summary.url).host}`; } catch { return `${summary.transport} MCP server`; } }
  if (summary.command) return `stdio MCP via \`${[summary.command, ...(summary.args || [])].join(" ").slice(0, 80)}\``;
  return `${summary.transport} MCP server`;
}

// ---------- usage tables ----------
const root = readJSON(path.join(HOME, ".claude.json")) || {};
const skillUsage = root.skillUsage || {};
const pluginUsage = root.pluginUsage || {};
const DAY = 86_400_000;
const now = Date.now();

function classifyUsage(usageCount, lastUsedAt, { passive = false } = {}) {
  if (usageCount == null && lastUsedAt == null) return passive ? "info" : "unknown";
  const count = usageCount || 0;
  if (count > 0) return "good";
  // count == 0
  if (lastUsedAt && now - lastUsedAt < 7 * DAY) return "warn"; // recent but unused
  return "bad";
}

function usageLabel(usageCount, lastUsedAt, usageClass) {
  if (usageClass === "unknown") return "no usage signal";
  if (usageClass === "info") return "passive";
  if (usageCount && usageCount > 0) {
    return `✅ ${usageCount.toLocaleString()} use${usageCount === 1 ? "" : "s"}`;
  }
  if (lastUsedAt && now - lastUsedAt < 7 * DAY) return "⚠️ never (recent install)";
  return "➖ never";
}

// ---------- collectors ----------
const items = [];
const projectNames = new Set();

function addSkill(scope, project, dirName, skillDir) {
  const fm = parseFrontmatter(readText(path.join(skillDir, "SKILL.md")));
  const name = fm.name || dirName;
  // usage tables key skills by their invocation name (bare or plugin:skill).
  const u = skillUsage[name] || skillUsage[dirName] || null;
  const usageCount = u ? (u.usageCount ?? null) : null;
  const lastUsedAt = u ? (u.lastUsedAt ?? null) : null;
  const usageClass = classifyUsage(usageCount, lastUsedAt);
  items.push({
    id: `skill:${scope === "global" ? "global" : "project:" + project}:${dirName}`,
    type: "skill", scope, project: scope === "global" ? null : project,
    name, description: fm.description || "",
    path: tilde(skillDir),
    usageCount, lastUsedAt, usageClass,
    usageLabel: usageLabel(usageCount, lastUsedAt, usageClass),
    removeCmd: scope === "global"
      ? `rm -rf ${tilde(skillDir)}`
      : `git rm -r .claude/skills/${dirName}`,
  });
}

function addAgent(scope, project, fileName, agentFile) {
  const base = fileName.replace(/\.md$/, "");
  const fm = parseFrontmatter(readText(agentFile));
  const name = fm.name || base;
  const u = skillUsage[name] || skillUsage[base] || null; // agents sometimes appear here too
  const usageCount = u ? (u.usageCount ?? null) : null;
  const lastUsedAt = u ? (u.lastUsedAt ?? null) : null;
  const usageClass = classifyUsage(usageCount, lastUsedAt, { passive: true });
  items.push({
    id: `agent:${scope === "global" ? "global" : "project:" + project}:${base}`,
    type: "agent", scope, project: scope === "global" ? null : project,
    name, description: fm.description || "",
    path: tilde(agentFile),
    usageCount, lastUsedAt, usageClass,
    usageLabel: usageLabel(usageCount, lastUsedAt, usageClass),
    removeCmd: scope === "global"
      ? `rm ${tilde(agentFile)}`
      : `git rm .claude/agents/${fileName}`,
  });
}

function addMcp(scope, project, name, cfg) {
  const summary = summarizeMcp(name, cfg);
  items.push({
    id: `mcp:${scope === "global" ? "global" : "project:" + project}:${name}`,
    type: "mcp", scope, project: scope === "global" ? null : project,
    name, description: mcpDescription(summary),
    source: mcpSourceLabel(summary),
    usageCount: null, lastUsedAt: null, usageClass: "info",
    usageLabel: "passive (surfaced on demand)",
    removeCmd: scope === "global"
      ? `claude mcp remove ${name} -s user`
      : `claude mcp remove ${name}`,
  });
}

// ---- global skills ----
const globalSkillsDir = path.join(CLAUDE, "skills");
for (const d of listDir(globalSkillsDir, "dir")) {
  const dir = path.join(globalSkillsDir, d);
  if (exists(path.join(dir, "SKILL.md"))) addSkill("global", null, d, dir);
}

// ---- global agents ----
const globalAgentsDir = path.join(CLAUDE, "agents");
for (const f of listDir(globalAgentsDir, "file")) {
  if (f.endsWith(".md")) addAgent("global", null, f, path.join(globalAgentsDir, f));
}

// ---- plugins (global; installed_plugins.json) ----
const installed = readJSON(path.join(CLAUDE, "plugins", "installed_plugins.json"));
if (installed && installed.plugins) {
  for (const [key, entries] of Object.entries(installed.plugins)) {
    const entry = Array.isArray(entries) ? entries[0] : entries;
    const [pluginName, marketplace] = key.split("@");
    const u = pluginUsage[key] || null;
    const usageCount = u ? (u.usageCount ?? null) : null;
    const lastUsedAt = u ? (u.lastUsedAt ?? null) : null;
    const usageClass = classifyUsage(usageCount, lastUsedAt);
    const installPath = entry && entry.installPath
      ? (entry.installPath.startsWith(HOME) ? tilde(entry.installPath) : "<external>")
      : undefined;
    items.push({
      // Bare name; the marketplace lives in `source` (matches the demo shape).
      id: `plugin:global:${pluginName}`,
      type: "plugin", scope: "global", project: null,
      name: pluginName,
      description: "", // not stored locally; the demo/curation can add it
      source: marketplace || "",
      version: entry ? entry.version : undefined,
      path: installPath,
      usageCount, lastUsedAt, usageClass,
      usageLabel: usageLabel(usageCount, lastUsedAt, usageClass),
      // The CLI wants the full name@marketplace form to uninstall.
      removeCmd: `claude plugins uninstall ${key} -y`,
    });
  }
}

// ---- global MCP servers ----
for (const [name, cfg] of Object.entries(root.mcpServers || {})) {
  addMcp("global", null, name, cfg);
}

// ---- per-project (from every known project path in ~/.claude.json) ----
const projectPaths = new Set();
if (exists(path.join(process.cwd(), ".claude")) || exists(path.join(process.cwd(), ".mcp.json"))) {
  projectPaths.add(process.cwd());
}
for (const p of Object.keys(root.projects || {})) projectPaths.add(p);

for (const projPath of projectPaths) {
  if (!exists(projPath)) continue; // path may be stale
  const project = path.basename(projPath);
  const projConf = (root.projects && root.projects[projPath]) || {};

  let touched = false;

  // project skills
  const pSkills = path.join(projPath, ".claude", "skills");
  for (const d of listDir(pSkills, "dir")) {
    const dir = path.join(pSkills, d);
    if (exists(path.join(dir, "SKILL.md"))) { addSkill("project", project, d, dir); touched = true; }
  }
  // project agents
  const pAgents = path.join(projPath, ".claude", "agents");
  for (const f of listDir(pAgents, "file")) {
    if (f.endsWith(".md")) { addAgent("project", project, f, path.join(pAgents, f)); touched = true; }
  }
  // project MCP servers — from ~/.claude.json projects[path].mcpServers and/or .mcp.json
  const fromConf = projConf.mcpServers || {};
  const fromFile = (readJSON(path.join(projPath, ".mcp.json")) || {}).mcpServers || {};
  for (const [name, cfg] of Object.entries({ ...fromFile, ...fromConf })) {
    addMcp("project", project, name, cfg); touched = true;
  }

  if (touched) projectNames.add(project);
}

// ---------- emit ----------
const inventory = {
  schemaVersion: SCHEMA_VERSION,
  generatedAt: new Date().toISOString(),
  generator: GENERATOR,
  machine: { platform: process.platform, node: process.version },
  projects: [...projectNames].sort((a, b) => a.localeCompare(b)),
  items,
};

const json = JSON.stringify(inventory, null, 2);

// summary counts for the console
const by = (t) => items.filter((i) => i.type === t).length;
const g = items.filter((i) => i.scope === "global").length;
const p = items.length - g;

if (TO_STDOUT) {
  process.stdout.write(json + "\n");
} else {
  fs.writeFileSync(OUT_FILE, json);
}

const log = (s) => process.stderr.write(s + "\n");
log("");
log("  Claude Inventory Tool — scan complete");
log("  ─────────────────────────────────────");
log(`  skills ${by("skill")}   plugins ${by("plugin")}   mcp ${by("mcp")}   agents ${by("agent")}`);
log(`  ${g} global · ${p} project   across ${inventory.projects.length} project${inventory.projects.length === 1 ? "" : "s"}`);
log("");
if (!TO_STDOUT) {
  log(`  ✓ wrote ${OUT_FILE}`);
  log("  → open the web app and drop this file in.");
  log("");
}
