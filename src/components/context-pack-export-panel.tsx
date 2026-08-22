"use client";

import { Check, Clipboard, Download } from "lucide-react";
import { useId, useMemo, useState } from "react";

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
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const previewId = useId();
  const exportedText = useMemo(
    () => formatContextPackExport(mode, data),
    [data, mode],
  );

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportedText);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    window.setTimeout(() => setCopyStatus("idle"), 1800);
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
            <p className="mt-2 max-w-3xl rounded-md border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-xs leading-5 text-[#92400e]">
              Context Packs can contain sensitive product rules, constraints, and
              evidence. Share exports only with approved AI tools and workspaces.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              aria-label={`Copy ${contextPackExportModeLabels[mode]} to clipboard`}
              onClick={copyExport}
              type="button"
              variant="secondary"
            >
              {copyStatus === "copied" ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Clipboard className="h-4 w-4" aria-hidden />
              )}
              {copyStatus === "copied" ? "Copied" : "Copy"}
            </Button>
            <Button
              aria-label={`Download ${contextPackExportModeLabels[mode]} as Markdown`}
              onClick={downloadExport}
              type="button"
              variant="secondary"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download
            </Button>
          </div>
        </div>
        <p aria-live="polite" className="sr-only" role="status">
          {copyStatus === "copied"
            ? "Context Pack export copied."
            : copyStatus === "failed"
              ? "Context Pack export could not be copied."
              : ""}
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-4" role="tablist" aria-label="Export mode">
          {contextPackExportModes.map((option) => (
            <button
              aria-controls={previewId}
              aria-selected={mode === option}
              className={[
                "min-h-10 rounded-md border px-3 text-left text-sm font-medium transition",
                mode === option
                  ? "border-[var(--accent)] bg-[#ccfbf1] text-[#134e4a]"
                  : "border-[var(--border)] bg-white text-[var(--muted-strong)] hover:bg-[var(--panel-subtle)]",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#99f6e4]",
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
        className="min-h-[420px] w-full resize-y rounded-b-md border-0 bg-white p-4 font-mono text-xs leading-6 text-[var(--muted-strong)] outline-none focus-visible:ring-4 focus-visible:ring-[#99f6e4] sm:min-h-[560px] xl:min-h-[820px]"
        id={previewId}
        readOnly
        value={exportedText}
      />
    </section>
  );
}
