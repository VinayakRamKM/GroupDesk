import { NextResponse } from "next/server";
import { getDeskBySlug, listRequests } from "@/lib/queries";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const desk = await getDeskBySlug(slug);
  if (!desk) {
    return NextResponse.json({ error: "Desk not found." }, { status: 404 });
  }
  const items = await listRequests(desk.id);
  return NextResponse.json({
    desk: {
      slug: desk.slug,
      name: desk.name,
      kind: desk.kind,
      managerName: desk.managerName,
      createdAt: desk.createdAt,
    },
    requests: items,
  });
}
