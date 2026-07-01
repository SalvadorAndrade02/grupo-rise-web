import { VehicleCondition, VehicleMediaType, VehicleStatus } from "@prisma/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { VehicleSearch } from "@/components/home/VehicleSearch";
import { QuickActions } from "@/components/home/QuickActions";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { MotorcycleBanner } from "@/components/home/MotorcycleBanner";
import { InfoCards } from "@/components/home/InfoCards";
import { FinalCTA } from "@/components/home/FinalCTA";
import { HomeStats } from "@/components/home/HomeStats";
import { HomeBrandCatalogs } from "@/components/home/HomeBrandCatalogs";
import { prisma } from "@/lib/prisma";
import { BranchesCarousel } from "@/components/home/BranchesCarousel";

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

function getBrandSortOrder(brandName: string) {
  const slug = getBrandSlug(brandName);
  const index = brandSlugOrder.indexOf(slug);

  return index === -1 ? 999 : index;
}

export default async function HomePage() {
  const [vehicles, branches, catalogBrands, allActiveVehicles] =
    await Promise.all([
      prisma.vehicle.findMany({
        where: {
          active: true,
          isFeatured: true,
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
        take: 8,
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

  const formattedBrandCards = catalogBrands
    .map((brand) => {
      const brandVehicles = brand.vehicles;

      const minPrice =
        brandVehicles.length > 0
          ? Math.min(...brandVehicles.map((vehicle) => vehicle.price))
          : 0;

      return {
        id: brand.id,
        name: brand.name,
        slug: getBrandSlug(brand.name),
        cover: getBrandCover(brand.name),
        count: brandVehicles.length,
        minPrice,
      };
    })
    .sort((a, b) => getBrandSortOrder(a.name) - getBrandSortOrder(b.name));

  const stats = {
    totalVehicles: allActiveVehicles.length,
    autos: allActiveVehicles.filter((vehicle) => vehicle.category === "AUTO")
      .length,
    motos: allActiveVehicles.filter((vehicle) => vehicle.category === "MOTO")
      .length,
    todoTerreno: allActiveVehicles.filter(
      (vehicle) => vehicle.category === "TODOTERRENO"
    ).length,
    branches: branches.length,
  };

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <Hero vehicles={formattedVehicles} />

      <section className="relative z-20 -mt-6 md:-mt-10">
        <VehicleSearch />
      </section>

      <HomeStats stats={stats} />

      <HomeBrandCatalogs brands={formattedBrandCards} />

      <QuickActions />

      <FeaturedVehicles vehicles={formattedVehicles} />

      <MotorcycleBanner />

      <BranchesCarousel branches={branches} />

      <InfoCards />

      <FinalCTA />

      <Footer />
    </main>
  );
}