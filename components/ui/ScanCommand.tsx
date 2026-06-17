"use client";

import { CodeBlock } from "./CodeBlock";
import { SCAN_COMMANDS, type Os } from "@/components/inventory/constants";
import { useOs, setOs } from "./use-os";

const ORDER: Os[] = ["mac", "windows"];

/**
 * The scan command, adapted to the chosen OS so it always runs as-is (the
 * Windows form is PowerShell-safe). The toggle is shared across the app, so
 * picking a platform here also updates the setup wizard's terminal steps.
 */
export function ScanCommand({
  variant = "oneLiner",
  showToggle = true,
}: {
  variant?: "oneLiner" | "twoStep";
  showToggle?: boolean;
}) {
  const os = useOs();
  return (
    <div className="stack gap-2">
      {showToggle && (
        <div className="row gap-1" role="group" aria-label="Choose your operating system">
          {ORDER.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={os === key}
              className={`chip${os === key ? " active" : ""}`}
              onClick={() => setOs(key)}
            >
              {SCAN_COMMANDS[key].label}
            </button>
          ))}
        </div>
      )}
      <CodeBlock code={SCAN_COMMANDS[os][variant]} />
    </div>
  );
}
