import { prisma } from "../src/lib/prisma";

const categories = [
  {
    name: "350",
    slug: "350",
    sortOrder: 1,
  },
  {
    name: "450",
    slug: "450",
    sortOrder: 2,
  },
  {
    name: "650",
    slug: "650",
    sortOrder: 3,
  },
];

async function main() {
  const brand = await prisma.brand.findFirst({
    where: {
      name: "Royal Enfield",
    },
  });

  if (!brand) {
    throw new Error(
      "No existe la marca Royal Enfield en Brand. Primero verifica que la marca esté creada."
    );
  }

  for (const category of categories) {
    await prisma.catalogCategory.upsert({
      where: {
        brandId_slug: {
          brandId: brand.id,
          slug: category.slug,
        },
      },
      update: {
        name: category.name,
        parentId: null,
        sortOrder: category.sortOrder,
        active: true,
      },
      create: {
        brandId: brand.id,
        name: category.name,
        slug: category.slug,
        parentId: null,
        sortOrder: category.sortOrder,
        active: true,
      },
    });
  }

  console.log("Categorías de Royal Enfield creadas correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });