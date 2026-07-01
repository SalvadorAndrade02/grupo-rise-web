import Link from "next/link";
import {
  ArrowUpDown,
  BadgeCheck,
  Car,
  Gauge,
  ImageIcon,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleCondition,
  VehicleMediaType,
  VehicleStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { VehicleLeadActions } from "@/components/vehicles/VehicleLeadActions";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

type CatalogPageProps = {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    tipo?: string;
    precio?: string;
    orden?: string;
  }>;
};

const categoryLabels: Record<VehicleCategory, string> = {
  AUTO: "Autos",
  MOTO: "Motos",
  TODOTERRENO: "Todo terreno",
};

const priceFilters = [
  {
    label: "Todos",
    value: "",
    min: null,
    max: null,
  },
  {
    label: "Hasta $250 mil",
    value: "0-250000",
    min: 0,
    max: 250000,
  },
  {
    label: "$250 mil a $500 mil",
    value: "250000-500000",
    min: 250000,
    max: 500000,
  },
  {
    label: "$500 mil a $800 mil",
    value: "500000-800000",
    min: 500000,
    max: 800000,
  },
  {
    label: "Más de $800 mil",
    value: "800000",
    min: 800000,
    max: null,
  },
];

const orderOptions = [
  {
    label: "Más recientes",
    value: "recientes",
  },
  {
    label: "Precio menor a mayor",
    value: "precio-asc",
  },
  {
    label: "Precio mayor a menor",
    value: "precio-desc",
  },
  {
    label: "Año más nuevo",
    value: "anio-desc",
  },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildCatalogHref(params: {
  q?: string;
  marca?: string;
  tipo?: string;
  precio?: string;
  orden?: string;
}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();

  return query ? `/catalogo?${query}` : "/catalogo";
}

function getPriceFilter(value?: string) {
  return (
    priceFilters.find((filter) => filter.value === value) ?? priceFilters[0]
  );
}

function sortVehicles<T extends { price: number; year: number; updatedAt: Date }>(
  vehicles: T[],
  order: string
) {
  return [...vehicles].sort((a, b) => {
    if (order === "precio-asc") {
      return a.price - b.price;
    }

    if (order === "precio-desc") {
      return b.price - a.price;
    }

    if (order === "anio-desc") {
      return b.year - a.year;
    }

    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;

  const query = String(params.q ?? "").trim();
  const selectedBrand = String(params.marca ?? "").trim();
  const selectedType = String(params.tipo ?? "").trim();
  const selectedPrice = String(params.precio ?? "").trim();
  const selectedOrder = String(params.orden ?? "recientes").trim();

  const [vehicles, brands] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        active: true,
        condition: VehicleCondition.NUEVO,
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
        updatedAt: "desc",
      },
    }),

    prisma.brand.findMany({
      where: {
        active: true,
        vehicles: {
          some: {
            active: true,
            condition: VehicleCondition.NUEVO,
            status: VehicleStatus.DISPONIBLE,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const priceFilter = getPriceFilter(selectedPrice);

  const filteredVehicles = sortVehicles(
    vehicles.filter((vehicle) => {
      const text = normalize(
        [
          vehicle.brand.name,
          vehicle.name,
          vehicle.model,
          vehicle.type,
          vehicle.description ?? "",
          vehicle.branch.name,
          vehicle.branch.city,
        ].join(" ")
      );

      const matchesQuery = query ? text.includes(normalize(query)) : true;

      const matchesBrand = selectedBrand
        ? String(vehicle.brandId) === selectedBrand
        : true;

      const matchesType = selectedType
        ? vehicle.category === selectedType
        : true;

      const matchesPriceMin =
        priceFilter.min !== null ? vehicle.price >= priceFilter.min : true;

      const matchesPriceMax =
        priceFilter.max !== null ? vehicle.price <= priceFilter.max : true;

      return (
        matchesQuery &&
        matchesBrand &&
        matchesType &&
        matchesPriceMin &&
        matchesPriceMax
      );
    }),
    selectedOrder
  );

  const featuredVehicles = filteredVehicles.filter(
    (vehicle) => vehicle.isFeatured
  );

  const totalBrands = new Set(vehicles.map((vehicle) => vehicle.brandId)).size;

  const minPrice =
    vehicles.length > 0
      ? Math.min(...vehicles.map((vehicle) => vehicle.price))
      : 0;

  return (
    <>
      <Header />
      <main className="bg-[var(--rise-bg)]">
        <section className="relative overflow-hidden bg-[var(--rise-navy)] px-4 py-16 text-white md:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.8),transparent_40%)]" />

          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100 backdrop-blur">
                <Sparkles size={16} />
                Catálogo de nuevos
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
                Vehículos nuevos disponibles en Grupo Rise
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100 md:text-lg">
                Explora unidades nuevas disponibles por marca, tipo, precio y
                sucursal. Solicita cotización o agenda una prueba desde la ficha
                del vehículo.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-4xl font-black">{vehicles.length}</p>
                <p className="mt-1 text-sm font-bold text-blue-100">
                  Unidades nuevas publicadas
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-4xl font-black">{totalBrands}</p>
                <p className="mt-1 text-sm font-bold text-blue-100">
                  Marcas disponibles
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-4xl font-black">
                  {minPrice ? formatMoney(minPrice) : "$0"}
                </p>
                <p className="mt-1 text-sm font-bold text-blue-100">
                  Precio inicial publicado
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10">
          <form
            action="/catalogo"
            className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/5 md:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Buscar y filtrar
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Encuentra tu siguiente vehículo
                </h2>
              </div>

              <Link
                href="/catalogo"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-600 transition hover:bg-white"
              >
                Limpiar filtros
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Buscar
                </span>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Buscar por modelo, marca o sucursal"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Marca
                </span>

                <select
                  name="marca"
                  defaultValue={selectedBrand}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="">Todas</option>

                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Tipo
                </span>

                <select
                  name="tipo"
                  defaultValue={selectedType}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="">Todos</option>

                  {Object.values(VehicleCategory).map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Precio
                </span>

                <select
                  name="precio"
                  defaultValue={selectedPrice}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  {priceFilters.map((filter) => (
                    <option key={filter.value || "all"} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Ordenar
                </span>

                <select
                  name="orden"
                  defaultValue={selectedOrder}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  {orderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)] md:w-auto"
            >
              <SlidersHorizontal size={18} />
              Aplicar filtros
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Resultados
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {filteredVehicles.length} unidad
                {filteredVehicles.length === 1 ? "" : "es"} encontrada
                {filteredVehicles.length === 1 ? "" : "s"}
              </h2>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--rise-border)] bg-white px-4 py-2 text-sm font-black text-slate-600">
              <ArrowUpDown size={17} />
              {orderOptions.find((option) => option.value === selectedOrder)
                ?.label ?? "Más recientes"}
            </div>
          </div>

          {featuredVehicles.length > 0 && (
            <section className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-[var(--rise-blue)]" />
                <h3 className="text-xl font-black">Destacados</h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {featuredVehicles.slice(0, 3).map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} featured />
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            {filteredVehicles.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
                <Search size={46} className="mx-auto text-slate-400" />

                <h3 className="mt-4 text-2xl font-black">
                  No encontramos vehículos con esos filtros
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Intenta limpiar los filtros o buscar por otra marca, modelo o
                  rango de precio.
                </p>

                <Link
                  href="/catalogo"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                >
                  Ver todo el catálogo
                </Link>
              </div>
            )}
          </section>
        </section>
      </main>

      <Footer />
    </>
  );
}

function VehicleCard({
  vehicle,
  featured = false,
}: {
  vehicle: Awaited<
    ReturnType<typeof prisma.vehicle.findMany>
  >[number] & {
    brand: {
      id: number;
      name: string;
    };
    branch: {
      id: number;
      name: string;
      city: string;
      state: string;
      whatsapp: string | null;
    };
    images: {
      id: number;
      url: string;
      alt: string | null;
      type: VehicleMediaType;
      order: number;
    }[];
  };
  featured?: boolean;
}) {
  const image = vehicle.mainImage || vehicle.images[0]?.url || "";

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10">
      <Link href={`/vehiculos/${vehicle.id}`} className="block">
        <div className="relative h-64 overflow-hidden bg-slate-100">
          {image ? (
            <img
              src={image}
              alt={vehicle.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon size={46} className="text-slate-400" />
            </div>
          )}

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--rise-navy)] shadow-sm">
              Nuevo
            </span>

            {featured && (
              <span className="rounded-full bg-[var(--rise-blue)] px-3 py-1 text-xs font-black text-white shadow-sm">
                Destacado
              </span>
            )}
          </div>

          <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-black text-white backdrop-blur">
            {categoryLabels[vehicle.category]}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                {vehicle.brand.name}
              </p>

              <h3 className="mt-2 text-2xl font-black text-[var(--rise-navy)]">
                {vehicle.name}
              </h3>
            </div>

            <BadgeCheck size={22} className="shrink-0 text-emerald-500" />
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
            {vehicle.description || "Unidad nueva disponible en Grupo Rise."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <Car size={15} />
                Año
              </div>

              <p className="mt-1 text-sm font-black text-slate-700">
                {vehicle.year}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <Gauge size={15} />
                Km
              </div>

              <p className="mt-1 text-sm font-black text-slate-700">
                {vehicle.mileage ?? 0} km
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <p className="text-xs font-bold text-slate-400">Desde</p>

            <p className="mt-1 text-3xl font-black text-[var(--rise-navy)]">
              {formatMoney(vehicle.price)}
            </p>

            <p className="mt-2 text-sm font-bold text-slate-500">
              {vehicle.branch.name}
            </p>
          </div>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <VehicleLeadActions
          vehicleId={vehicle.id}
          vehicleName={`${vehicle.brand.name} ${vehicle.name}`}
          branchId={vehicle.branchId}
          mode="compact"
        />
      </div>
    </article>
  );
}