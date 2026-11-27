import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const text = String(form.get("text") || form.get("title") || "");
  const url = new URL("/share", request.url);
  if (text) url.searchParams.set("text", text.slice(0, 4000));
  return NextResponse.redirect(url, 303);
}
