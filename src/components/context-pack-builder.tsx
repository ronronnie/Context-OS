"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoKnowledge } from "@/lib/demo-data";
import { buildContextPack, rankKnowledgeForTask } from "@/lib/retrieval";

const defaultTask =
  "I want to design bulk approval for expense exceptions in the admin console.";

export function ContextPackBuilder() {
  const [task, setTask] = useState(defaultTask);
  const [copied, setCopied] = useState(false);

  const ranked = useMemo(
    () => rankKnowledgeForTask(task, demoKnowledge).slice(0, 5),
    [task],
  );
  const pack = useMemo(() => buildContextPack(task, ranked), [task, ranked]);

  async function copyPack() {
    await navigator.clipboard.writeText(pack);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadPack() {
    const blob = new Blob([pack], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "context-os-pack.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card id="generate-pack">
      <CardHeader>
        <div>
          <p className="text-sm font-medium text-[var(--accent-strong)]">
            Generate Context Pack
          </p>
          <CardTitle>Task-specific memory for AI tools</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Task</span>
          <textarea
            value={task}
            onChange={(event) => setTask(event.target.value)}
            rows={5}
            className="mt-2 w-full resize-none rounded-md border border-[var(--line)] bg-white p-3 text-sm leading-6 outline-none ring-[#99f6e4] transition focus:ring-4"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={copyPack}>
            <Copy className="h-4 w-4" aria-hidden />
            {copied ? "Copied" : "Copy pack"}
          </Button>
          <Button type="button" variant="secondary" onClick={downloadPack}>
            <Download className="h-4 w-4" aria-hidden />
            Export markdown
          </Button>
        </div>

        <div className="rounded-md border border-[var(--line)] bg-[var(--panel-muted)] p-3">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden />
            <p className="text-sm font-semibold">Relevant memory</p>
          </div>
          <div className="space-y-3">
            {ranked.map((item) => (
              <div key={item.id} className="rounded-md bg-white p-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{item.type}</Badge>
                  <Badge variant={item.status === "verified" ? "success" : "warning"}>
                    {item.status}
                  </Badge>
                  <Badge variant="outline">score {item.score.toFixed(2)}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6">{item.claim}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
