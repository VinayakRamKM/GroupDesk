import { NextResponse } from "next/server";
import { publicStats } from "@/lib/queries";

export async function GET() {
  const stats = await publicStats();
  return NextResponse.json(stats);
}
