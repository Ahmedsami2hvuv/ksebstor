import { prisma } from "@/lib/prisma";

export async function getStoreHomeData(query?: string) {
  const where = query
    ? {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
          { variants: { some: { sku: { contains: query, mode: "insensitive" as const } } } },
        ],
      }
    : { isActive: true };

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      include: { children: { where: { isActive: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: {
        ...where,
        category: { isActive: true },
        branch: { isActive: true },
      },
      include: { images: true, variants: true, category: true, branch: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return { categories, products };
}
