import {
  BadgeCheck,
  Gauge,
  MapPin,
  Sparkles,
  Tags,
} from "lucide-react";
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

const excludedBrandNames = [
  "Aprilia",
  "Moto Guzzi",
  "Moto Guzzy",
  "Plex",
  "Motoplex",
  "MotoPlex",
  "MOTOPLEX",
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function InventoryPage() {
  const [vehicles, brands] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        active: true,
        condition: VehicleCondition.SEMINUEVO,
        status: VehicleStatus.DISPONIBLE,
        brand: {
          active: true,
          name: {
            notIn: excludedBrandNames,
          },
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
    }),

    prisma.brand.findMany({
      where: {
        active: true,
        name: {
          notIn: excludedBrandNames,
        },
      },

      orderBy: {
        name: "asc",
      },
    }),
  ]);

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
    mainImage:
      vehicle.mainImage ||
      vehicle.images[0]?.url ||
      "",
  }));

  const formattedBrands = brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
  }));

  const uniqueBrands = new Set(
    vehicles.map((vehicle) => vehicle.brand.name)
  );

  const uniqueBranches = new Set(
    vehicles.map((vehicle) => vehicle.branch.id)
  );

  const minPrice =
    vehicles.length > 0
      ? Math.min(
        ...vehicles.map((vehicle) => vehicle.price)
      )
      : 0;

  const maxYear =
    vehicles.length > 0
      ? Math.max(
        ...vehicles.map((vehicle) => vehicle.year)
      )
      : 0;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#f4f6f7] text-[#0a0f14]">
        {/* Encabezado */}
        <section className="relative overflow-hidden bg-[#192a3a] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_30%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

          <div className="relative mx-auto w-full max-w-[1440px] px-5 py-12 md:px-8 lg:px-10 lg:py-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#dfe7ec] backdrop-blur-sm">
                <Sparkles size={15} />
                Inventario Grupo Rise
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.045em] md:text-5xl lg:text-6xl">
                Seminuevos disponibles
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/65 md:text-base">
                Encuentra unidades seminuevas disponibles en
                nuestras agencias, compara precios y consulta los
                detalles de cada vehículo.
              </p>
            </div>
          </div>
        </section>

        <InventoryClient
          vehicles={formattedVehicles}
          brands={formattedBrands}
        />
      </main>

      <Footer />
    </>
  );
}

function InventoryMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BadgeCheck;
  value: string;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
      <Icon
        size={17}
        className="shrink-0 text-[#dfe7ec]"
      />

      <div className="flex items-baseline gap-2">
        <span className="text-sm font-black text-white">
          {value}
        </span>

        <span className="text-[10px] font-black uppercase tracking-[0.13em] text-white/55">
          {label}
        </span>
      </div>
    </div>
  );
}