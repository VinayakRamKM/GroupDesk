import { NextResponse } from "next/server";
import { DESK_KINDS } from "@/lib/constants";
import { createDesk } from "@/lib/queries";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    kind?: string;
    managerName?: string;
  };
  const name = (body.name || "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "Give the desk a name." }, { status: 400 });
  }
  const kind =
    DESK_KINDS.some((k) => k.id === body.kind) ? body.kind! : "other";
  const desk = await createDesk({
    name,
    kind,
    managerName: body.managerName || "Manager",
  });
  return NextResponse.json({
    slug: desk.slug,
    managerKey: desk.managerKey,
    name: desk.name,
  });
}
