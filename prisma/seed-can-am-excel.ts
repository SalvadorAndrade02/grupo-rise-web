import "dotenv/config";

import {
  VehicleCategory,
  VehicleCondition,
  VehicleStatus,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";

const CREATE_INVENTORY_UNITS = true;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const categories = [
  {
    name: "Side-by-Side",
    slug: "side-by-side",
    parentSlug: null,
    sortOrder: 1,
  },
  {
    name: "SxS Utilitario Recreación",
    slug: "sxs-utilitario-recreacion",
    parentSlug: "side-by-side",
    sortOrder: 2,
  },
  {
    name: "SxS Recreativo Deportivo",
    slug: "sxs-recreativo-deportivo",
    parentSlug: "side-by-side",
    sortOrder: 3,
  },
  {
    name: "Cuatrimotos",
    slug: "cuatrimotos",
    parentSlug: null,
    sortOrder: 4,
  },
  {
    name: "ATV Utilitario Recreación",
    slug: "atv-utilitario-recreacion",
    parentSlug: "cuatrimotos",
    sortOrder: 5,
  },
  {
    name: "ATV Recreativo",
    slug: "atv-recreativo",
    parentSlug: "cuatrimotos",
    sortOrder: 6,
  },
];

const catalogModels = [
  {
    name: "Defender",
    categorySlug: "sxs-utilitario-recreacion",
    year: 2026,
    priceFrom: 273900,
    sortOrder: 1,
    subtitle: "SxS utilitario para trabajo, campo y aventura.",
    description:
      "Can-Am Defender 2026 es un side-by-side utilitario para trabajo y uso todo terreno. Cuenta con múltiples opciones de motor y capacidad de carga/remolque para actividades exigentes.",
    specs:
      "Año 2026, Precio desde $273,900 MXN, Tipo SxS, Motor HD7 650 cc 52 hp u opciones HD9 976 cc 65 hp, CVT, Turf/2WD/4WD seleccionable",
    features:
      "Trabajo pesado, Capacidad de carga, Capacidad de remolque, Manejo todo terreno, Uso utilitario",
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/utilitario-recreacion/defender.html",
  },
  {
    name: "Defender HD11",
    categorySlug: "sxs-utilitario-recreacion",
    year: 2026,
    priceFrom: 539900,
    sortOrder: 2,
    subtitle: "SxS utilitario con motor HD11 para trabajo pesado.",
    description:
      "Can-Am Defender HD11 2026 es un side-by-side utilitario con motor de trabajo pesado y potencia indicada de 95 hp. Está diseñado para jornadas exigentes, campo y aventura.",
    specs:
      "Año 2026, Precio desde $539,900 MXN, Tipo SxS, Motor HD11 95 hp, Transmisión rediseñada, Tracción 4x4",
    features:
      "Motor de trabajo pesado, Alta capacidad utilitaria, Manejo todo terreno, Transmisión rediseñada, Uso profesional",
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/utilitario-recreacion/defender-hd11.html",
  },
  {
    name: "Maverick R",
    categorySlug: "sxs-recreativo-deportivo",
    year: 2026,
    priceFrom: 854900,
    sortOrder: 3,
    subtitle: "SxS deportivo de alto desempeño para terrenos extremos.",
    description:
      "Can-Am Maverick R 2026 es un side-by-side deportivo de alto desempeño con motor turbo de 3 cilindros y hasta 240 hp. Está pensado para potencia, control y manejo agresivo en terrenos exigentes.",
    specs:
      "Año 2026, Precio desde $854,900 MXN, Tipo SxS, Motor Rotax 3 cilindros turbo 240 hp, Doble embrague 7 velocidades, Smart-Lok según versión",
    features:
      "Alto desempeño, Manejo deportivo, Potencia turbo, Control en terrenos exigentes, Versiones MAX y rc disponibles",
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/recreativo-deportivo/maverick-r.html",
  },
  {
    name: "Maverick X3",
    categorySlug: "sxs-recreativo-deportivo",
    year: 2026,
    priceFrom: 483900,
    sortOrder: 4,
    subtitle: "SxS deportivo turboalimentado para aventura todoterreno.",
    description:
      "Can-Am Maverick X3 2026 es un side-by-side deportivo turboalimentado para desempeño todoterreno, aventura y conducción recreativa deportiva.",
    specs:
      "Año 2026, Precio desde $483,900 MXN, Tipo SxS, Motor turboalimentado, CVT, Tracción 4x4",
    features:
      "Turboalimentado, Desempeño todoterreno, Diseño deportivo, Aventura extrema, Manejo recreativo",
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/recreativo-deportivo/maverick-x3.html",
  },
  {
    name: "Outlander PRO",
    categorySlug: "atv-utilitario-recreacion",
    year: 2026,
    priceFrom: 190900,
    sortOrder: 5,
    subtitle: "ATV utilitario para trabajos duros y largas jornadas.",
    description:
      "Can-Am Outlander PRO 2026 es una cuatrimoto utilitaria para trabajos duros, campo y uso en terrenos difíciles. Está orientada a durabilidad, confiabilidad y tareas exigentes.",
    specs:
      "Año 2026, Precio desde $190,900 MXN, Tipo ATV, Motor Rotax calibrado para trabajo, CVT, 4x4 según versión",
    features:
      "Trabajo pesado, Uso en campo, ATV utilitaria, Durabilidad, Jornadas exigentes",
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/atv/utilitario-recreacion/outlander-pro.html",
  },
  {
    name: "Outlander 500/700",
    categorySlug: "atv-recreativo",
    year: 2026,
    priceFrom: 164900,
    sortOrder: 6,
    subtitle: "ATV recreativo-utilitario para trabajo y aventura.",
    description:
      "Can-Am Outlander 500/700 2026 combina capacidad de trabajo y espíritu de aventura. Es una cuatrimoto para recorridos, caminos, uso cotidiano y actividades al aire libre.",
    specs:
      "Año 2026, Precio desde $164,900 MXN, Tipo ATV, Motor 500/700, CVT, 4x4 según versión",
    features:
      "Versátil, Recreativo-utilitario, Trabajo ligero, Aventura, Buena relación precio-capacidad",
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/atv/recreativo/outlander-500-700.html",
  },
  {
    name: "Outlander 850/1000R",
    categorySlug: "atv-recreativo",
    year: 2026,
    priceFrom: 339900,
    sortOrder: 7,
    subtitle: "ATV recreativo de alto desempeño con potencia y estabilidad.",
    description:
      "Can-Am Outlander 850/1000R 2026 es una cuatrimoto recreativa de mayor potencia, estabilidad y capacidad de carga para terrenos difíciles y recorridos exigentes.",
    specs:
      "Año 2026, Precio desde $339,900 MXN, Tipo ATV, Motor 850/1000R, Hasta 101 hp, CVT, 4x4 según versión",
    features:
      "Potencia elevada, Estabilidad, Capacidad de carga, Suspensión avanzada, Terrenos difíciles",
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/atv/recreativo/outlander-850-1000r.html",
  },
];

const inventoryUnits = [
  {
    modelName: "Defender",
    name: "Defender",
    year: 2026,
    price: 273900,
    passengers: 3,
    motor: "HD7 650 cc 52 hp / opciones HD9 976 cc 65 hp",
    transmission: "CVT; Turf/2WD/4WD seleccionable",
    tires: "XPS Trail Force 27 x 9/11 x 14 plg; rin 14 plg",
    notes: "Precio oficial desde. Transporte y preparación no incluidos.",
    isFeatured: true,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/utilitario-recreacion/defender.html",
  },
  {
    modelName: "Defender",
    name: "Defender DPS",
    year: 2026,
    price: 369900,
    passengers: 3,
    motor: "HD9 976 cc 65 hp; opciones según paquete",
    transmission: "CVT PRO-TORQ; Turf/2WD/4WD seleccionable",
    tires: "XPS Trail Force / Trail King 27 plg; rin 14 plg",
    notes: "Incluye dirección asistida dinámica DPS.",
    isFeatured: false,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/utilitario-recreacion/defender.html",
  },
  {
    modelName: "Defender",
    name: "Defender MAX",
    year: 2026,
    price: 323900,
    passengers: 6,
    motor: "HD7 650 cc 52 hp / HD9 976 cc 65 hp",
    transmission: "CVT; Turf/2WD/4WD seleccionable",
    tires: "XPS Trail Force 27 x 9/11 x 14 plg",
    notes: "Versión MAX de seis plazas.",
    isFeatured: false,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/utilitario-recreacion/defender.html",
  },
  {
    modelName: "Defender HD11",
    name: "Defender HD11",
    year: 2026,
    price: 539900,
    passengers: 3,
    motor: "Motor HD11, 95 hp",
    transmission: "Transmisión rediseñada; 4x4",
    tires: "Dato por especificar desde ficha oficial",
    notes: "Modelo utilitario pesado.",
    isFeatured: true,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/utilitario-recreacion/defender-hd11.html",
  },
  {
    modelName: "Maverick R",
    name: "Maverick R X",
    year: 2026,
    price: 854900,
    passengers: 2,
    motor: "Rotax 3 cilindros turbo, 240 hp",
    transmission: "Doble embrague 7 velocidades; Smart-Lok según versión",
    tires: "ITP Tenacity 30 plg, rines 15 plg",
    notes: "Paquete deportivo base X.",
    isFeatured: true,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/recreativo-deportivo/maverick-r.html",
  },
  {
    modelName: "Maverick R",
    name: "Maverick R X rs",
    year: 2026,
    price: 984900,
    passengers: 2,
    motor: "Rotax 3 cilindros turbo, 240 hp",
    transmission: "Doble embrague 7 velocidades; Smart-Lok según versión",
    tires: "ITP Tenacity 32 plg, rines 16 plg con beadlock",
    notes: "Opción Smart-Shox disponible.",
    isFeatured: false,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/recreativo-deportivo/maverick-r.html",
  },
  {
    modelName: "Maverick R",
    name: "Maverick R X rc",
    year: 2026,
    price: 1059900,
    passengers: 2,
    motor: "Rotax 3 cilindros turbo, 240 hp",
    transmission: "Doble embrague 7 velocidades; Smart-Lok con modo rocas",
    tires: "Dato por especificar desde ficha oficial",
    notes: "Versión para rocas / senderos.",
    isFeatured: false,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/recreativo-deportivo/maverick-r.html",
  },
  {
    modelName: "Maverick R",
    name: "Maverick R MAX X",
    year: 2026,
    price: 929900,
    passengers: 4,
    motor: "Rotax 3 cilindros turbo, 240 hp",
    transmission: "Doble embrague 7 velocidades",
    tires: "Dato por especificar desde ficha oficial",
    notes: "Versión MAX de cuatro plazas.",
    isFeatured: false,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/recreativo-deportivo/maverick-r.html",
  },
  {
    modelName: "Maverick R",
    name: "Maverick R MAX X rs",
    year: 2026,
    price: 1059900,
    passengers: 4,
    motor: "Rotax 3 cilindros turbo, 240 hp",
    transmission: "Doble embrague 7 velocidades",
    tires: "ITP Tenacity 32 plg, rines 16 plg con beadlock",
    notes: "MAX X rs.",
    isFeatured: false,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/recreativo-deportivo/maverick-r.html",
  },
  {
    modelName: "Maverick R",
    name: "Maverick R MAX X rc",
    year: 2026,
    price: 1139900,
    passengers: 4,
    motor: "Rotax 3 cilindros turbo, 240 hp",
    transmission: "Doble embrague 7 velocidades; Smart-Lok con modo rocas",
    tires: "Dato por especificar desde ficha oficial",
    notes: "MAX X rc.",
    isFeatured: false,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/recreativo-deportivo/maverick-r.html",
  },
  {
    modelName: "Maverick X3",
    name: "Maverick X3",
    year: 2026,
    price: 483900,
    passengers: 2,
    motor: "Turboalimentado; dato por versión",
    transmission: "CVT / 4x4",
    tires: "Dato por especificar desde ficha oficial",
    notes: "Modelo con precio desde en listado oficial.",
    isFeatured: false,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/sxs/recreativo-deportivo/maverick-x3.html",
  },
  {
    modelName: "Outlander PRO",
    name: "Outlander PRO",
    year: 2026,
    price: 190900,
    passengers: 1,
    motor: "Rotax calibrado para trabajo; dato por versión",
    transmission: "CVT / 4x4 según versión",
    tires: "Dato por especificar desde ficha oficial",
    notes: "ATV utilitario.",
    isFeatured: false,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/atv/utilitario-recreacion/outlander-pro.html",
  },
  {
    modelName: "Outlander 500/700",
    name: "Outlander 500/700",
    year: 2026,
    price: 164900,
    passengers: 1,
    motor: "500/700; dato por versión",
    transmission: "CVT / 4x4 según versión",
    tires: "Dato por especificar desde ficha oficial",
    notes: "ATV recreativo/utilitario.",
    isFeatured: false,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/atv/recreativo/outlander-500-700.html",
  },
  {
    modelName: "Outlander 850/1000R",
    name: "Outlander 850/1000R",
    year: 2026,
    price: 339900,
    passengers: 1,
    motor: "850/1000R; dato por versión",
    transmission: "CVT / 4x4 según versión",
    tires: "Dato por especificar desde ficha oficial",
    notes: "ATV de mayor potencia.",
    isFeatured: false,
    sourceUrl:
      "https://can-am.brp.com/off-road/mx/es/modelos/atv/recreativo/outlander-850-1000r.html",
  },
];

function buildVehicleDescription(unit: (typeof inventoryUnits)[number]) {
  return `Can-Am ${unit.name} ${unit.year} disponible en Grupo Rise. Unidad nueva de la familia ${unit.modelName}, clasificada como todo terreno. ${unit.notes}`;
}

function buildVehicleSpecs(unit: (typeof inventoryUnits)[number]) {
  return [
    `Año ${unit.year}`,
    `Precio desde $${unit.price.toLocaleString("es-MX")} MXN`,
    `Pasajeros ${unit.passengers}`,
    unit.motor,
    unit.transmission,
    unit.tires,
  ].join(", ");
}

function buildVehicleFeatures(unit: (typeof inventoryUnits)[number]) {
  return [
    "Unidad nueva",
    "Condición disponible",
    "Todo terreno",
    unit.modelName,
    unit.notes.replace(/\.$/, ""),
  ].join(", ");
}

async function getOrCreateCanAmBrand() {
  const existingBrand = await prisma.brand.findFirst({
    where: {
      name: "Can-Am",
    },
  });

  if (existingBrand) {
    return prisma.brand.update({
      where: {
        id: existingBrand.id,
      },
      data: {
        category: VehicleCategory.TODOTERRENO,
        active: true,
      },
    });
  }

  return prisma.brand.create({
    data: {
      name: "Can-Am",
      category: VehicleCategory.TODOTERRENO,
      active: true,
    },
  });
}

async function getDefaultBranch() {
  const branch = await prisma.branch.findFirst({
    where: {
      active: true,
      OR: [
        { name: "Polaris Monterrey Carretera Nacional" },
        { name: "Polaris Monterrey Cumbres" },
        { name: "Polaris Saltillo" },
      ],
    },
    orderBy: {
      id: "asc",
    },
  });

  if (branch) {
    return branch;
  }

  const anyActiveBranch = await prisma.branch.findFirst({
    where: {
      active: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (!anyActiveBranch) {
    throw new Error(
      "No existe ninguna sucursal activa. Crea o activa una sucursal antes de sembrar inventario."
    );
  }

  return anyActiveBranch;
}

async function seedCategories(brandId: number) {
  const categoryBySlug = new Map<string, { id: number }>();

  for (const item of categories.filter((category) => !category.parentSlug)) {
    const category = await prisma.catalogCategory.upsert({
      where: {
        brandId_slug: {
          brandId,
          slug: item.slug,
        },
      },
      update: {
        name: item.name,
        parentId: null,
        active: true,
        sortOrder: item.sortOrder,
      },
      create: {
        brandId,
        name: item.name,
        slug: item.slug,
        parentId: null,
        active: true,
        sortOrder: item.sortOrder,
      },
      select: {
        id: true,
      },
    });

    categoryBySlug.set(item.slug, category);
  }

  for (const item of categories.filter((category) => category.parentSlug)) {
    const parent = categoryBySlug.get(item.parentSlug ?? "");

    if (!parent) {
      throw new Error(`No se encontró la categoría padre ${item.parentSlug}`);
    }

    const category = await prisma.catalogCategory.upsert({
      where: {
        brandId_slug: {
          brandId,
          slug: item.slug,
        },
      },
      update: {
        name: item.name,
        parentId: parent.id,
        active: true,
        sortOrder: item.sortOrder,
      },
      create: {
        brandId,
        name: item.name,
        slug: item.slug,
        parentId: parent.id,
        active: true,
        sortOrder: item.sortOrder,
      },
      select: {
        id: true,
      },
    });

    categoryBySlug.set(item.slug, category);
  }

  return categoryBySlug;
}

async function seedCatalogModels(
  brandId: number,
  categoryBySlug: Map<string, { id: number }>
) {
  const modelByName = new Map<string, { id: number }>();

  for (const item of catalogModels) {
    const category = categoryBySlug.get(item.categorySlug);

    if (!category) {
      throw new Error(`No se encontró la categoría ${item.categorySlug}`);
    }

    const slug = slugify(item.name);

    const model = await prisma.catalogModel.upsert({
      where: {
        brandId_slug: {
          brandId,
          slug,
        },
      },
      update: {
        categoryId: category.id,
        name: item.name,
        categoryType: VehicleCategory.TODOTERRENO,
        year: item.year,
        priceFrom: item.priceFrom,
        subtitle: item.subtitle,
        description: item.description,
        specs: item.specs,
        features: `${item.features}, Fuente oficial: ${item.sourceUrl}`,
        active: true,
        sortOrder: item.sortOrder,
      },
      create: {
        brandId,
        categoryId: category.id,
        name: item.name,
        slug,
        categoryType: VehicleCategory.TODOTERRENO,
        year: item.year,
        priceFrom: item.priceFrom,
        subtitle: item.subtitle,
        description: item.description,
        specs: item.specs,
        features: `${item.features}, Fuente oficial: ${item.sourceUrl}`,
        active: true,
        sortOrder: item.sortOrder,
      },
      select: {
        id: true,
      },
    });

    modelByName.set(item.name, model);
  }

  return modelByName;
}

async function seedInventoryUnits(brandId: number, branchId: number) {
  let created = 0;
  let updated = 0;

  for (const unit of inventoryUnits) {
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        brandId,
        branchId,
        name: unit.name,
        year: unit.year,
        condition: VehicleCondition.NUEVO,
      },
      select: {
        id: true,
      },
    });

    const data = {
      name: unit.name,
      model: unit.modelName,
      type: VehicleCategory.TODOTERRENO,
      brandId,
      branchId,
      category: VehicleCategory.TODOTERRENO,
      condition: VehicleCondition.NUEVO,
      status: VehicleStatus.DISPONIBLE,
      year: unit.year,
      price: unit.price,
      mileage: 0,
      description: buildVehicleDescription(unit),
      specs: buildVehicleSpecs(unit),
      features: `${buildVehicleFeatures(unit)}, Fuente oficial: ${unit.sourceUrl}`,
      mainImage: "",
      active: true,
      isFeatured: unit.isFeatured,
    };

    if (existingVehicle) {
      await prisma.vehicle.update({
        where: {
          id: existingVehicle.id,
        },
        data: {
          ...data,
          branchAvailabilities: {
            deleteMany: {},
            create: {
              branchId,
            },
          },
        },
      });

      updated += 1;
    } else {
      await prisma.vehicle.create({
        data: {
          ...data,
          branchAvailabilities: {
            create: {
              branchId,
            },
          },
        },
      });

      created += 1;
    }
  }

  return { created, updated };
}

async function main() {
  const brand = await getOrCreateCanAmBrand();
  const categoryBySlug = await seedCategories(brand.id);
  const modelByName = await seedCatalogModels(brand.id, categoryBySlug);

  console.log(`Marca Can-Am lista: ${brand.id}`);
  console.log(`Categorías procesadas: ${categoryBySlug.size}`);
  console.log(`Modelos base procesados: ${modelByName.size}`);

  if (CREATE_INVENTORY_UNITS) {
    const branch = await getDefaultBranch();
    const result = await seedInventoryUnits(brand.id, branch.id);

    console.log(`Sucursal usada para inventario: ${branch.name}`);
    console.log(`Unidades nuevas creadas: ${result.created}`);
    console.log(`Unidades nuevas actualizadas: ${result.updated}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
