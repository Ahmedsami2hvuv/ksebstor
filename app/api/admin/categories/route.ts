import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.category.findMany({ include: { children: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await prisma.category.create({
    data: { name: body.name, parentId: body.parentId || null, slug: toSlug(body.name) },
  });
  return NextResponse.json({ data: created });
}
