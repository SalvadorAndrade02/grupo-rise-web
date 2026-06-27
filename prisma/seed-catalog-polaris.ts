import { prisma } from "../src/lib/prisma";

const categories = [
  {
    name: "RZR",
    slug: "rzr",
    sortOrder: 1,
  },
  {
    name: "Polaris Xpedition",
    slug: "polaris-xpedition",
    sortOrder: 2,
  },
  {
    name: "Ranger",
    slug: "ranger",
    sortOrder: 3,
  },
  {
    name: "Sportsman",
    slug: "sportsman",
    sortOrder: 4,
  },
  {
    name: "Youth",
    slug: "youth",
    sortOrder: 5,
  },
];

async function main() {
  const brand = await prisma.brand.findFirst({
    where: {
      name: "Polaris",
    },
  });

  if (!brand) {
    throw new Error(
      "No existe la marca Polaris en Brand. Primero verifica que la marca esté creada."
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

  console.log("Categorías de Polaris creadas correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });