import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ text: z.string().trim().min(1).max(800) });

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Server voice is unavailable." }, { status: 503 });
  let input: z.infer<typeof schema>;
  try {
    const result = schema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: "Invalid speech text." }, { status: 400 });
    input = result.data;
  } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  try {
    const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "coral",
        input: input.text,
        instructions: "Speak clearly and naturally, with a conversational interview tone.",
        response_format: "mp3"
      }),
      signal: AbortSignal.timeout(20000)
    });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ error: "Voice generation unavailable." }, { status: 502 });
    return new Response(upstream.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "Voice generation timed out." }, { status: 502 }); }
}
