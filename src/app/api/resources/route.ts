import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { normalizeResourceUrl } from "@/lib/resourceUrl";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "").trim() || "General";
  const description = String(body.description ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const url = normalizeResourceUrl(String(body.url ?? ""));
  if (!url) {
    return NextResponse.json({ error: "Enter a valid http(s) link" }, { status: 400 });
  }

  const resource = await prisma.resource.create({
    data: { title, category, url, description: description || null },
  });

  return NextResponse.json({ resource }, { status: 201 });
}
