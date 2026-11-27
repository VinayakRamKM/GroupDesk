import { NextResponse } from "next/server";
import { getDeskBySlug, updateRequest } from "@/lib/queries";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/desks/[slug]/requests/[id]">,
) {
  const { slug, id } = await ctx.params;
  const desk = await getDeskBySlug(slug);
  if (!desk) {
    return NextResponse.json({ error: "Desk not found." }, { status: 404 });
  }
  const patch = (await request.json()) as {
    status?: unknown;
    assigneeName?: unknown;
    closeNote?: unknown;
  };
  const update: {
    status?: "open" | "doing" | "closed";
    assigneeName?: string | null;
    closeNote?: string | null;
  } = {};
  if ("status" in patch) {
    if (
      patch.status !== "open" &&
      patch.status !== "doing" &&
      patch.status !== "closed"
    ) {
      return NextResponse.json({ error: "Invalid request status." }, { status: 400 });
    }
    update.status = patch.status;
  }
  if ("assigneeName" in patch) {
    if (
      patch.assigneeName !== null &&
      (typeof patch.assigneeName !== "string" ||
        patch.assigneeName.trim().length > 80)
    ) {
      return NextResponse.json({ error: "Invalid assignee name." }, { status: 400 });
    }
    update.assigneeName =
      typeof patch.assigneeName === "string"
        ? patch.assigneeName.trim() || null
        : null;
  }
  if ("closeNote" in patch) {
    if (
      patch.closeNote !== null &&
      (typeof patch.closeNote !== "string" || patch.closeNote.length > 500)
    ) {
      return NextResponse.json({ error: "Invalid close note." }, { status: 400 });
    }
    update.closeNote =
      typeof patch.closeNote === "string" ? patch.closeNote.trim() || null : null;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid updates provided." }, { status: 400 });
  }
  const row = await updateRequest(desk.id, id, update);
  if (!row) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  return NextResponse.json({ request: row });
}
