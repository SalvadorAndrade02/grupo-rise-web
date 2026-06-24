import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { InventoryClient } from "@/components/inventory/InventoryClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type InventoryPageProps = {
  searchParams: Promise<{
    categoria?: string;
  }>;
};

type InitialCategory = "TODOS" | "AUTO" | "MOTO" | "TODOTERRENO";

function getInitialCategory(value?: string): InitialCategory {
  if (value === "AUTO" || value === "MOTO" || value === "TODOTERRENO") {
    return value;
  }

  return "TODOS";
}

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const params = await searchParams;
  const initialCategory = getInitialCategory(params.categoria);
  const [vehicles, brands, branches] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        active: true,
        branch: {
          active: true,
        },
      },
      include: {
        brand: true,
        branch: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.brand.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.branch.findMany({
      where: {
        active: true,
      },
      orderBy: {
        city: "asc",
      },
    }),
  ]);

  const formattedVehicles = vehicles.map((vehicle) => ({
    id: vehicle.id,
    category: vehicle.category,
    condition: vehicle.condition,
    status: vehicle.status,
    brandId: vehicle.brandId,
    brandName: vehicle.brand.name,
    branchId: vehicle.branchId,
    branchName: vehicle.branch.name,
    branchCity: vehicle.branch.city,
    name: vehicle.name,
    model: vehicle.model,
    version: vehicle.version,
    year: vehicle.year,
    price: vehicle.price,
    type: vehicle.type,
    color: vehicle.color,
    mileage: vehicle.mileage,
    specs: vehicle.specs
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    mainImage: vehicle.mainImage,
    isFeatured: vehicle.isFeatured,
  }));

  const formattedBrands = brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    category: brand.category,
  }));

  const formattedBranches = branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    city: branch.city,
    state: branch.state,
  }));

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <InventoryClient
        key={initialCategory}
        vehicles={formattedVehicles}
        brands={formattedBrands}
        branches={formattedBranches}
        initialCategory={initialCategory}
      />
      <Footer />
    </main>
  );
}