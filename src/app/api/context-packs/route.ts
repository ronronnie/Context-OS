import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { demoKnowledge } from "@/lib/demo-data";
import { buildContextPack, rankKnowledgeForTask } from "@/lib/retrieval";

const contextPackRequestSchema = z.object({
  task: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = contextPackRequestSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "A task with at least 8 characters is required." },
      { status: 400 },
    );
  }

  const ranked = rankKnowledgeForTask(result.data.task, demoKnowledge).slice(0, 8);

  return NextResponse.json({
    task: result.data.task,
    memory: ranked,
    markdown: buildContextPack(result.data.task, ranked),
  });
}
