import { NextResponse } from "next/server";
import { ensureDemoDesk } from "@/lib/queries";

export async function POST() {
  const { desk } = await ensureDemoDesk();
  return NextResponse.json({ slug: desk.slug });
}
