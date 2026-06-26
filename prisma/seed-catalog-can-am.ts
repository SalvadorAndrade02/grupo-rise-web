import { prisma } from "../src/lib/prisma";

type CategorySeed = {
  name: string;
  slug: string;
  sortOrder: number;
  parentSlug?: string;
};

type ModelSeed = {
  name: string;
  slug: string;
  year: number;
  categorySlug: string;
  sortOrder: number;
};

const categories: CategorySeed[] = [
  {
    name: "Side-by-Side",
    slug: "side-by-side",
    sortOrder: 1,
  },
  {
    name: "Utilitario Recreación",
    slug: "utilitario-recreacion",
    parentSlug: "side-by-side",
    sortOrder: 1,
  },
  {
    name: "Recreativo Deportivo",
    slug: "recreativo-deportivo",
    parentSlug: "side-by-side",
    sortOrder: 2,
  },
  {
    name: "Cuatrimotos",
    slug: "cuatrimotos",
    sortOrder: 2,
  },
  {
    name: "Vehículos 3 ruedas",
    slug: "vehiculos-3-ruedas",
    sortOrder: 3,
  },
  {
    name: "Motos",
    slug: "motos",
    sortOrder: 4,
  },
];

const models: ModelSeed[] = [
  {
    name: "Defender",
    slug: "defender",
    year: 2026,
    categorySlug: "utilitario-recreacion",
    sortOrder: 1,
  },
  {
    name: "Defender HD11",
    slug: "defender-hd11",
    year: 2026,
    categorySlug: "utilitario-recreacion",
    sortOrder: 2,
  },
  {
    name: "Maverick R",
    slug: "maverick-r",
    year: 2026,
    categorySlug: "recreativo-deportivo",
    sortOrder: 3,
  },
  {
    name: "Maverick X3",
    slug: "maverick-x3",
    year: 2026,
    categorySlug: "recreativo-deportivo",
    sortOrder: 4,
  },
];

async function main() {
  const brand = await prisma.brand.findFirst({
    where: {
      name: "Can-Am",
    },
  });

  if (!brand) {
    throw new Error(
      "No existe la marca Can-Am en Brand. Primero crea o siembra la marca Can-Am."
    );
  }

  const categoryBySlug = new Map<string, { id: number; slug: string }>();

  for (const category of categories.filter((item) => !item.parentSlug)) {
    const savedCategory = await prisma.catalogCategory.upsert({
      where: {
        brandId_slug: {
          brandId: brand.id,
          slug: category.slug,
        },
      },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        active: true,
      },
      create: {
        brandId: brand.id,
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        active: true,
      },
    });

    categoryBySlug.set(savedCategory.slug, {
      id: savedCategory.id,
      slug: savedCategory.slug,
    });
  }

  for (const category of categories.filter((item) => item.parentSlug)) {
    const parent = categoryBySlug.get(category.parentSlug ?? "");

    if (!parent) {
      throw new Error(`No se encontró la categoría padre ${category.parentSlug}`);
    }

    const savedCategory = await prisma.catalogCategory.upsert({
      where: {
        brandId_slug: {
          brandId: brand.id,
          slug: category.slug,
        },
      },
      update: {
        name: category.name,
        parentId: parent.id,
        sortOrder: category.sortOrder,
        active: true,
      },
      create: {
        brandId: brand.id,
        name: category.name,
        slug: category.slug,
        parentId: parent.id,
        sortOrder: category.sortOrder,
        active: true,
      },
    });

    categoryBySlug.set(savedCategory.slug, {
      id: savedCategory.id,
      slug: savedCategory.slug,
    });
  }

  for (const model of models) {
    const category = categoryBySlug.get(model.categorySlug);

    if (!category) {
      throw new Error(`No se encontró la categoría ${model.categorySlug}`);
    }

    await prisma.catalogModel.upsert({
      where: {
        brandId_slug: {
          brandId: brand.id,
          slug: model.slug,
        },
      },
      update: {
        name: model.name,
        year: model.year,
        categoryId: category.id,
        categoryType: "TODOTERRENO",
        sortOrder: model.sortOrder,
        active: true,
      },
      create: {
        brandId: brand.id,
        categoryId: category.id,
        name: model.name,
        slug: model.slug,
        categoryType: "TODOTERRENO",
        year: model.year,
        priceFrom: null,
        subtitle: null,
        description: "",
        specs: "",
        features: "",
        mainImage: null,
        active: true,
        sortOrder: model.sortOrder,
      },
    });
  }

  console.log("Catálogo Can-Am inicial creado correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });