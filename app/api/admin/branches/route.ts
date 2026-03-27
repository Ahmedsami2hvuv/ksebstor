import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.branch.findMany({ include: { children: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await prisma.branch.create({
    data: { name: body.name, parentId: body.parentId || null, code: body.code || toSlug(body.name).slice(0, 12) },
  });
  return NextResponse.json({ data: created });
}
