import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { answerContext } from "@/lib/answer-context";
import { answerInstructions } from "@/lib/answer-guidance";

const schema = z.object({
  resume: z.string().min(10).max(25000),
  job: z.string().max(12000),
  question: z.string().min(3).max(4000),
  focus: z.enum(["Technical", "Behavioral", "System Design", "General"]),
  length: z.enum(["Concise", "Detailed"]),
  turns: z.array(z.object({ question: z.string().max(4000), answer: z.string().max(4000) })).max(30)
});

export function GET() {
  return NextResponse.json({ available: Boolean(process.env.OPENAI_API_KEY) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI provider is not configured for this site." }, { status: 503 });
  let input: z.infer<typeof schema>;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Check the resume and interview question." }, { status: 400 });
    input = parsed.data;
  } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", signal: controller.signal,
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        stream: true,
        store: false,
        max_output_tokens: input.length === "Concise" ? 800 : 1100,
        instructions: answerInstructions(input.length, input.question),
        input: JSON.stringify({ resumeEvidence: answerContext(input.resume, input.question, input.job), jobDescription: input.job.slice(0, 1600), focus: input.focus, recentConversation: input.turns.slice(-3), interviewerQuestion: input.question })
      })
    });
    if (!upstream.ok || !upstream.body) {
      clearTimeout(timeout);
      return NextResponse.json({ error: upstream.status === 429 ? "AI rate limit reached. Try again later." : "AI provider could not answer right now." }, { status: 502 });
    }

    const reader = upstream.body.getReader();
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(output) {
        const decoder = new TextDecoder(); let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const frames = buffer.split(/\r?\n\r?\n/); buffer = frames.pop() ?? "";
            for (const frame of frames) {
              const line = frame.split(/\r?\n/).find(part => part.startsWith("data: "));
              if (!line || line === "data: [DONE]") continue;
              try {
                const event = JSON.parse(line.slice(6)) as { type?: string; delta?: string; error?: { message?: string } };
                if (event.type === "response.output_text.delta" && event.delta) output.enqueue(encoder.encode(JSON.stringify({ delta: event.delta }) + "\n"));
                if (event.type === "response.failed") output.enqueue(encoder.encode(JSON.stringify({ error: "AI response failed." }) + "\n"));
              } catch { /* Ignore non-JSON provider frames. */ }
            }
          }
          output.enqueue(encoder.encode(JSON.stringify({ done: true }) + "\n"));
        } catch { output.enqueue(encoder.encode(JSON.stringify({ error: "Connection to AI provider interrupted." }) + "\n")); }
        finally { clearTimeout(timeout); output.close(); reader.releaseLock(); }
      },
      cancel() { controller.abort(); clearTimeout(timeout); }
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ error: "AI provider timed out. Try again." }, { status: 502 });
  }
}
