import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.branch.findMany({ include: { children: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await prisma.branch.create({
    data: {
      name: body.name,
      parentId: body.parentId || null,
      code: body.code || toSlug(`${body.name}-${Date.now()}`).slice(0, 24),
      imageUrl: body.imageUrl || "",
      notes: body.notes || "",
      sortOrder: Number(body.sortOrder ?? 0),
    },
  });
  return NextResponse.json({ data: created });
}
