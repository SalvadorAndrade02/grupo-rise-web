import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { InventoryClient } from "@/components/inventory/InventoryClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type InventoryPageProps = {
  searchParams: Promise<{
    categoria?: string;
    condicion?: string;
    q?: string;
    precioMax?: string;
  }>;
};

type InitialCategory = "TODOS" | "AUTO" | "MOTO" | "TODOTERRENO";
type InitialCondition = "TODOS" | "NUEVO" | "SEMINUEVO";

function getInitialCategory(value?: string): InitialCategory {
  if (value === "AUTO" || value === "MOTO" || value === "TODOTERRENO") {
    return value;
  }

  return "TODOS";
}

function getInitialCondition(value?: string): InitialCondition {
  if (value === "NUEVO" || value === "SEMINUEVO") {
    return value;
  }

  return "TODOS";
}

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const params = await searchParams;

  const initialCategory = getInitialCategory(params.categoria);
  const initialCondition = getInitialCondition(params.condicion);
  const initialSearch = params.q ?? "";
  const initialMaxPrice = params.precioMax ?? "TODOS";
  const vehicles = await prisma.vehicle.findMany({
    where: {
      active: true,
      condition: "SEMINUEVO",
      status: "DISPONIBLE",
      branch: {
        active: true,
      },
    },
    include: {
      brand: true,
      branch: true,
      images: {
        where: {
          type: "IMAGE",
        },
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: [
      {
        brand: {
          name: "asc",
        },
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const formattedVehicles = vehicles.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
    brandName: vehicle.brand.name,
    category: vehicle.category,
    condition: vehicle.condition,
    status: vehicle.status,
    year: vehicle.year,
    price: vehicle.price,
    mileage: vehicle.mileage,
    branchId: vehicle.branchId,
    branchName: vehicle.branch.name,
    branchCity: vehicle.branch.city,
    branchWhatsapp: vehicle.branch.whatsapp,
    mainImage: vehicle.images[0]?.url || vehicle.mainImage || "",
  }));
  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <InventoryClient vehicles={formattedVehicles} />
      <Footer />
    </main>
  );
}