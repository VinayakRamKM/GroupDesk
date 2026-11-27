import { NextResponse } from "next/server";
import { extractFromChat } from "@/lib/extract";
import { getDeskBySlug } from "@/lib/queries";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const desk = await getDeskBySlug(slug);
  if (!desk) {
    return NextResponse.json({ error: "Desk not found." }, { status: 404 });
  }
  const body = (await request.json()) as { text?: string };
  const text = (body.text || "").trim();
  if (!text) {
    return NextResponse.json({ error: "Paste a chat first." }, { status: 400 });
  }
  const items = extractFromChat(text);
  return NextResponse.json({ items });
}
