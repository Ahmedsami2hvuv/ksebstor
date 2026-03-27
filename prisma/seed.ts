import { PrismaClient } from "@prisma/client";
import { toSlug } from "../lib/utils";

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "الكترونيات" },
    update: {},
    create: { name: "الكترونيات", slug: "الكترونيات" },
  });
  const branch = await prisma.branch.upsert({
    where: { code: "baghdad" },
    update: {},
    create: { name: "بغداد", code: "baghdad" },
  });

  const product = await prisma.product.upsert({
    where: { slug: "سماعة-لاسلكية-ديمو" },
    update: {},
    create: {
      name: "سماعة لاسلكية ديمو",
      slug: toSlug("سماعة لاسلكية ديمو"),
      description: "منتج افتراضي لتجربة المتجر.",
      categoryId: category.id,
      branchId: branch.id,
      images: { create: [{ url: "/vercel.svg", sortOrder: 0 }] },
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: "DEMO-1" },
    update: {},
    create: {
      productId: product.id,
      sku: "DEMO-1",
      color: "اسود",
      size: "M",
      shape: "قياسي",
      purchasePrice: 18000,
      sellingPrice: 25000,
      stockQty: 25,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
