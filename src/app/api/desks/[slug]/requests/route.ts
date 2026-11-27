import { NextResponse } from "next/server";
import type { ExtractedItem } from "@/lib/classify";
import { getDeskBySlug, insertRequests } from "@/lib/queries";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/desks/[slug]/requests">,
) {
  const { slug } = await ctx.params;
  const desk = await getDeskBySlug(slug);
  if (!desk) {
    return NextResponse.json({ error: "Desk not found." }, { status: 404 });
  }
  const body = (await request.json()) as {
    items?: ExtractedItem[];
    source?: string;
    title?: string;
    requesterName?: string;
    category?: string;
    body?: string;
  };

  if (body.items?.length) {
    const kept = body.items.filter((item) => item.keep !== false);
    const created = await insertRequests(
      desk.id,
      kept,
      body.source || "whatsapp",
    );
    return NextResponse.json({
      created,
      duplicatesSkipped: kept.length - created.length,
    });
  }

  const title = (body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Write the request." }, { status: 400 });
  }
  const created = await insertRequests(
    desk.id,
    [
      {
        title,
        body: (body.body || title).trim(),
        category: (body.category as ExtractedItem["category"]) || "other",
        priority: "normal",
        requesterName: (body.requesterName || "Someone").trim(),
        sourceMessage: body.body || title,
        keep: true,
      },
    ],
    body.source || "form",
  );
  return NextResponse.json({ created });
}
