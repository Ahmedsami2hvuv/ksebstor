import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.storeOrder.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data });
}
