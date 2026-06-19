// Shared constants for the scan flow. If the deploy URL changes, update here.
export const SITE_URL = "https://stackcleaner.com";

export type Os = "mac" | "windows";

/**
 * The command(s) users run to produce stack-cleaner.json, per platform.
 *
 * macOS / Linux uses bash/zsh, where `curl … | node` pipes cleanly.
 * Windows uses PowerShell, where `curl` is an alias for Invoke-WebRequest and
 * the bundled-curl flags (`-fsSL`) fail — so we call `curl.exe` explicitly and
 * download-then-run (the `;` separates two PowerShell statements) rather than
 * piping, which avoids the alias entirely. (curl.exe ships in Windows 10 1803+.)
 */
export const SCAN_COMMANDS: Record<Os, { label: string; oneLiner: string; twoStep: string }> = {
  mac: {
    label: "macOS / Linux",
    oneLiner: `curl -fsSL ${SITE_URL}/scan.mjs | node`,
    twoStep: `curl -fsSL ${SITE_URL}/scan.mjs -o stack-cleaner-scan.mjs\nnode stack-cleaner-scan.mjs`,
  },
  windows: {
    label: "Windows (PowerShell)",
    oneLiner: `curl.exe -fsSL ${SITE_URL}/scan.mjs -o stack-cleaner-scan.mjs; node stack-cleaner-scan.mjs`,
    twoStep: `curl.exe -fsSL ${SITE_URL}/scan.mjs -o stack-cleaner-scan.mjs\nnode stack-cleaner-scan.mjs`,
  },
};

// A single representative command (macOS / Linux form) for places that show one
// without an OS toggle, e.g. the README mirror. Prefer <ScanCommand /> in the UI.
export const SCAN_ONELINER = SCAN_COMMANDS.mac.oneLiner;
export const SCAN_TWO_STEP = SCAN_COMMANDS.mac.twoStep;

/**
 * The primary, no-copy-paste-gymnastics way to scan: one command, identical on
 * every OS, no `curl … | node` pipe to worry about. Runs the published npm
 * package (which bundles the same `scan.mjs`). Requires Node, which Claude Code
 * already installs. This is the recommended path; the curl one-liners above stay
 * as the read-it-first / no-npm alternatives.
 */
export const SCAN_NPX = "npx stack-cleaner@latest";
