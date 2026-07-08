import {
  VehicleCategory,
  VehicleCondition,
  VehicleMediaType,
  VehicleStatus,
} from "@prisma/client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { VehicleCategoryShowcase } from "@/components/home/VehicleCategoryShowcase";
import { QuickActions } from "@/components/home/QuickActions";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { MotorcycleBanner } from "@/components/home/MotorcycleBanner";
import { InfoCards } from "@/components/home/InfoCards";
import { FinalCTA } from "@/components/home/FinalCTA";
import { HomeStats } from "@/components/home/HomeStats";
import { HomeBrandCatalogs } from "@/components/home/HomeBrandCatalogs";
import { BranchesCarousel } from "@/components/home/BranchesCarousel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const catalogBrandNames = [
  "Can-Am",
  "Polaris",
  "Sea-Doo",
  "Sea Doo",
  "SeaDoo",
  "Triumph",
  "Triumph Motorcycles",
  "Royal Enfield",
  "Indian",
  "Indian Motorcycle",
  "Zeekr",
  "Zeekrlife",
  "Lynk & Co",
];

const brandSlugOrder = [
  "can-am",
  "polaris",
  "sea-doo",
  "triumph-motorcycles",
  "royal-enfield",
  "indian-motorcycle",
  "zeekrlife",
  "lynk-co",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugifyBrand(value: string) {
  return normalize(value)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getBrandSlug(brandName: string) {
  const customSlugs: Record<string, string> = {
    "Can-Am": "can-am",
    Polaris: "polaris",
    "Sea-Doo": "sea-doo",
    "Sea Doo": "sea-doo",
    SeaDoo: "sea-doo",
    Triumph: "triumph-motorcycles",
    "Triumph Motorcycles": "triumph-motorcycles",
    "Royal Enfield": "royal-enfield",
    Indian: "indian-motorcycle",
    "Indian Motorcycle": "indian-motorcycle",
    Zeekr: "zeekrlife",
    Zeekrlife: "zeekrlife",
    "Lynk & Co": "lynk-co",
  };

  return customSlugs[brandName] ?? slugifyBrand(brandName);
}

function getBrandCover(brandName: string) {
  const covers: Record<string, string> = {
    "Can-Am": "/catalog/brands/can-am.jpg",
    Polaris: "/catalog/brands/polaris.jpg",
    "Sea-Doo": "/catalog/brands/sea-doo.jpg",
    "Sea Doo": "/catalog/brands/sea-doo.jpg",
    SeaDoo: "/catalog/brands/sea-doo.jpg",

    Triumph: "/catalog/brands/triumph.jpg",
    "Triumph Motorcycles": "/catalog/brands/triumph.jpg",

    "Royal Enfield": "/catalog/brands/royal-enfield.jpg",

    Indian: "/catalog/brands/indian.jpg",
    "Indian Motorcycle": "/catalog/brands/indian.jpg",

    Zeekr: "/catalog/brands/zeekr.jpg",
    Zeekrlife: "/catalog/brands/zeekr.jpg",

    "Lynk & Co": "/catalog/brands/lynkco.jpg",
  };

  return covers[brandName] ?? "";
}

function getBrandLogo(brandName: string) {
  const logos: Record<string, string> = {
    "Can-Am": "/catalog/brands/can-am.jpg",
    Polaris: "/catalog/brands/polaris.jpg",
    "Sea-Doo": "/catalog/brands/sea-doo.jpg",
    "Sea Doo": "/catalog/brands/sea-doo.jpg",
    SeaDoo: "/catalog/brands/sea-doo.jpg",

    Triumph: "/catalog/brands/triumph.jpg",
    "Triumph Motorcycles": "/catalog/brands/triumph.jpg",

    "Royal Enfield": "/catalog/brands/royal-enfield.jpg",

    Indian: "/catalog/brands/indian.jpg",
    "Indian Motorcycle": "/catalog/brands/indian.jpg",

    Zeekr: "/catalog/brands/zeekr.jpg",
    Zeekrlife: "/catalog/brands/zeekr.jpg",

    "Lynk & Co": "/catalog/brands/lynkco.jpg",
  };

  return logos[brandName] ?? null;
}

function getBrandSortOrder(brandName: string) {
  const slug = getBrandSlug(brandName);
  const index = brandSlugOrder.indexOf(slug);

  return index === -1 ? 999 : index;
}

export default async function HomePage() {
  const [
    featuredVehicleCandidates,
    branches,
    catalogBrands,
    allActiveVehicles,
  ] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        active: true,
        status: VehicleStatus.DISPONIBLE,
        brand: {
          active: true,
        },
        branch: {
          active: true,
        },
      },
      include: {
        brand: true,
        branch: true,
        images: {
          where: {
            type: VehicleMediaType.IMAGE,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 80,
    }),

    prisma.branch.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          city: "asc",
        },
      ],
    }),

    prisma.brand.findMany({
      where: {
        active: true,
        name: {
          in: catalogBrandNames,
        },
      },
      include: {
        vehicles: {
          where: {
            active: true,
            condition: VehicleCondition.NUEVO,
            status: VehicleStatus.DISPONIBLE,
            branch: {
              active: true,
            },
          },
          include: {
            images: {
              where: {
                type: VehicleMediaType.IMAGE,
              },
              orderBy: {
                order: "asc",
              },
              take: 1,
            },
          },
        },
      },
    }),

    prisma.vehicle.findMany({
      where: {
        active: true,
        status: VehicleStatus.DISPONIBLE,
        brand: {
          active: true,
        },
        branch: {
          active: true,
        },
      },
      select: {
        category: true,
      },
    }),
  ]);

  const featuredVehiclesByBrand = new Map<
    string,
    (typeof featuredVehicleCandidates)[number]
  >();

  const orderedFeaturedCandidates = [...featuredVehicleCandidates].sort(
    (a, b) => {
      const brandOrder =
        getBrandSortOrder(a.brand.name) - getBrandSortOrder(b.brand.name);

      if (brandOrder !== 0) {
        return brandOrder;
      }

      if (a.isFeatured !== b.isFeatured) {
        return Number(b.isFeatured) - Number(a.isFeatured);
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    }
  );

  orderedFeaturedCandidates.forEach((vehicle) => {
    const brandSlug = getBrandSlug(vehicle.brand.name);

    if (!brandSlugOrder.includes(brandSlug)) {
      return;
    }

    if (!featuredVehiclesByBrand.has(brandSlug)) {
      featuredVehiclesByBrand.set(brandSlug, vehicle);
    }
  });

  const vehicles = Array.from(featuredVehiclesByBrand.values()).sort(
    (a, b) =>
      getBrandSortOrder(a.brand.name) - getBrandSortOrder(b.brand.name)
  );

  const formattedVehicles = vehicles.map((vehicle) => ({
    id: vehicle.id,
    category: vehicle.category,
    condition: vehicle.condition,
    status: vehicle.status,
    brandName: vehicle.brand.name,
    branchId: vehicle.branchId,
    branchCity: vehicle.branch.city,
    branchWhatsapp: vehicle.branch.whatsapp,
    name: vehicle.name,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    type: vehicle.type,
    specs: vehicle.specs
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    mainImage: vehicle.mainImage || vehicle.images[0]?.url || "",
  }));

  /*
   * Seleccionamos una imagen representativa de cada categoría.
   * Se priorizan las unidades marcadas como destacadas y después las más nuevas.
   */
  const categoryVehicleCandidates = [...featuredVehicleCandidates].sort(
    (a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return Number(b.isFeatured) - Number(a.isFeatured);
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    }
  );

  function getCategoryImage(category: VehicleCategory) {
    const vehicle = categoryVehicleCandidates.find(
      (candidate) =>
        candidate.category === category &&
        Boolean(candidate.mainImage || candidate.images[0]?.url)
    );

    return vehicle?.mainImage || vehicle?.images[0]?.url || null;
  }

  const autoImage = getCategoryImage(VehicleCategory.AUTO);
  const motorcycleImage = getCategoryImage(VehicleCategory.MOTO);
  const offRoadImage = getCategoryImage(VehicleCategory.TODOTERRENO);

  const formattedBrandCards = catalogBrands
    .map((brand) => {
      return {
        id: brand.id,
        name: brand.name,
        slug: getBrandSlug(brand.name),
        logo: getBrandLogo(brand.name),
      };
    })
    .sort(
      (a, b) => getBrandSortOrder(a.name) - getBrandSortOrder(b.name)
    );

  const stats = {
    totalVehicles: allActiveVehicles.length,
    autos: allActiveVehicles.filter(
      (vehicle) => vehicle.category === VehicleCategory.AUTO
    ).length,
    motos: allActiveVehicles.filter(
      (vehicle) => vehicle.category === VehicleCategory.MOTO
    ).length,
    todoTerreno: allActiveVehicles.filter(
      (vehicle) => vehicle.category === VehicleCategory.TODOTERRENO
    ).length,
    branches: branches.length,
  };

  return (
    <main className="min-h-screen bg-[#f4f3ef] text-[#0a0f14]">
      <Header />

      <Hero vehicles={formattedVehicles} />

      <VehicleCategoryShowcase
        autoImage={autoImage}
        motorcycleImage={motorcycleImage}
        offRoadImage={offRoadImage}
      />

      <HomeBrandCatalogs brands={formattedBrandCards} />

      <FeaturedVehicles vehicles={formattedVehicles} />

      <BranchesCarousel branches={branches} />

      <Footer />
    </main>
  );
}