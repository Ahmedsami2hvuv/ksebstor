import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const data = await prisma.category.update({
    where: { id },
    data: {
      name: body.name,
      parentId: body.parentId || null,
      imageUrl: body.imageUrl || "",
      notes: body.notes || "",
      sortOrder: Number(body.sortOrder ?? 0),
    },
  });
  return NextResponse.json({ data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
