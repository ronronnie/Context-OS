"use client";

import { Check, Clipboard, Download } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  contextPackExportModeLabels,
  contextPackExportModes,
  formatContextPackExport,
  getContextPackExportFilename,
  type ContextPackExportData,
  type ContextPackExportMode,
} from "@/lib/context-packs/exports";

export function ContextPackExportPanel({
  data,
}: {
  data: ContextPackExportData;
}) {
  const [mode, setMode] = useState<ContextPackExportMode>("codex");
  const [copied, setCopied] = useState(false);
  const exportedText = useMemo(
    () => formatContextPackExport(mode, data),
    [data, mode],
  );

  async function copyExport() {
    await navigator.clipboard.writeText(exportedText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadExport() {
    const blob = new Blob([exportedText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getContextPackExportFilename(mode, data);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
      <div className="border-b border-[var(--border)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Export</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Choose a tool-specific format and copy or download the complete prompt.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={copyExport} type="button" variant="secondary">
              {copied ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Clipboard className="h-4 w-4" aria-hidden />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button onClick={downloadExport} type="button" variant="secondary">
              <Download className="h-4 w-4" aria-hidden />
              Download
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-4" role="tablist" aria-label="Export mode">
          {contextPackExportModes.map((option) => (
            <button
              aria-selected={mode === option}
              className={[
                "min-h-10 rounded-md border px-3 text-left text-sm font-medium transition",
                mode === option
                  ? "border-[var(--accent)] bg-[#ccfbf1] text-[#134e4a]"
                  : "border-[var(--border)] bg-white text-[var(--muted-strong)] hover:bg-[var(--panel-subtle)]",
              ].join(" ")}
              key={option}
              onClick={() => setMode(option)}
              role="tab"
              type="button"
            >
              {contextPackExportModeLabels[option]}
            </button>
          ))}
        </div>
      </div>
      <textarea
        aria-label={`${contextPackExportModeLabels[mode]} preview`}
        className="min-h-[820px] w-full resize-y rounded-b-md border-0 bg-white p-4 font-mono text-xs leading-6 text-[var(--muted-strong)] outline-none"
        readOnly
        value={exportedText}
      />
    </section>
  );
}
