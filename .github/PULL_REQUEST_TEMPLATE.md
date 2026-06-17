<!--
  Thanks for contributing. This template mirrors the project's verify gate.
  See CONTRIBUTING.md for the full contributor guide.
-->

## What & why

<!-- A short description of the change and the reason for it. -->

**Linked issue:** <!-- e.g. Closes #123 -->

## Verify gate

Tick what applies. The first box is required for every PR.

- [ ] Ran `npm run build` — green, and TypeScript types pass (types are checked during the build).
- [ ] **Scanner changes only:** ran `node public/scan.mjs --stdout` and grepped the output for `/Users/`, `sk-`, `gh[pousr]_`, `xox`, `AKIA`, and long tokens — **zero hits**. The scan output must never contain a real secret or an absolute `/Users/<name>/` path.
- [ ] Eyeballed `/`, `/setup`, and `/inventory` at **1280px** and **375px** — no horizontal page overflow (codeblocks may scroll inside their own box).
- [ ] Updated `CHANGELOG.md` if this change is user-facing.
- [ ] Updated `SECURITY.md` and `CHANGELOG.md` notes if the redaction rules or `schemaVersion` changed.
- [ ] No secrets in fixtures or test data.
