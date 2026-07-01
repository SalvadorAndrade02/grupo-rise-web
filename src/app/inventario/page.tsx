import { BadgeCheck, Gauge, MapPin, Sparkles, Tags } from "lucide-react";
import {
  VehicleCondition,
  VehicleMediaType,
  VehicleStatus,
} from "@prisma/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { InventoryClient } from "@/components/inventory/InventoryClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function InventoryPage() {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      active: true,
      condition: VehicleCondition.SEMINUEVO,
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
    mainImage: vehicle.mainImage || vehicle.images[0]?.url || "",
  }));

  const uniqueBrands = new Set(vehicles.map((vehicle) => vehicle.brand.name));
  const uniqueBranches = new Set(vehicles.map((vehicle) => vehicle.branch.id));

  const minPrice =
    vehicles.length > 0
      ? Math.min(...vehicles.map((vehicle) => vehicle.price))
      : 0;

  const maxYear =
    vehicles.length > 0
      ? Math.max(...vehicles.map((vehicle) => vehicle.year))
      : 0;

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="relative overflow-hidden bg-[var(--rise-navy)] px-4 py-16 text-white md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.8),transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100 backdrop-blur">
              <Sparkles size={16} />
              Inventario seminuevo
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
              Seminuevos disponibles
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100 md:text-lg">
              Explora unidades seminuevas disponibles en Grupo Rise, revisa
              precio, sucursal, kilometraje y solicita información directamente
              con un asesor.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <BadgeCheck size={24} className="text-blue-100" />

              <p className="mt-4 text-4xl font-black">{vehicles.length}</p>

              <p className="mt-1 text-sm font-bold text-blue-100">
                Unidades disponibles
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <Tags size={24} className="text-blue-100" />

              <p className="mt-4 text-4xl font-black">{uniqueBrands.size}</p>

              <p className="mt-1 text-sm font-bold text-blue-100">
                Marcas con seminuevos
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <MapPin size={24} className="text-blue-100" />

              <p className="mt-4 text-4xl font-black">{uniqueBranches.size}</p>

              <p className="mt-1 text-sm font-bold text-blue-100">
                Sucursales disponibles
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <Gauge size={24} className="text-blue-100" />

              <p className="mt-4 text-4xl font-black">
                {minPrice ? formatMoney(minPrice) : "$0"}
              </p>

              <p className="mt-1 text-sm font-bold text-blue-100">
                Precio inicial
              </p>
            </div>
          </div>

          {maxYear > 0 && (
            <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-blue-100 backdrop-blur">
              Modelos hasta año {maxYear}
            </div>
          )}
        </div>
      </section>

      <InventoryClient vehicles={formattedVehicles} />

      <Footer />
    </main>
  );
}