import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  Gauge,
  ImageIcon,
  MapPin,
  Search,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleCondition,
  VehicleStatus,
} from "@prisma/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";
import { VehicleLeadActions } from "@/components/vehicles/VehicleLeadActions";

export const dynamic = "force-dynamic";

type CatalogBrandPageProps = {
  params: Promise<{
    marca: string;
  }>;
  searchParams: Promise<{
    q?: string;
    tipo?: string;
    anio?: string;
    sucursal?: string;
  }>;
};

const brandSlugMap: Record<string, string> = {
  "Can-Am": "can-am",
  Polaris: "polaris",
  "Royal Enfield": "royal-enfield",
  "Sea-Doo": "sea-doo",
  "Sea Doo": "sea-doo",
  SeaDoo: "sea-doo",
  Triumph: "triumph-motorcycles",
  "Triumph Motorcycles": "triumph-motorcycles",
  Indian: "indian-motorcycle",
  "Indian Motorcycle": "indian-motorcycle",
  Zeekr: "zeekrlife",
  Zeekrlife: "zeekrlife",
  "Lynk & Co": "lynk-co",
};

function getBrandSlug(name: string) {
  return (
    brandSlugMap[name] ??
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
  );
}

function getBrandCover(name: string) {
  const slug = getBrandSlug(name);

  const covers: Record<string, string> = {
    "can-am": "/catalog/brands/can-am.jpg",
    polaris: "/catalog/brands/polaris.jpg",
    "royal-enfield": "/catalog/brands/royal-enfield.jpg",
    "sea-doo": "/catalog/brands/sea-doo.jpg",
    "triumph-motorcycles": "/catalog/brands/triumph.jpg",
    "indian-motorcycle": "/catalog/brands/indian.jpg",
    zeekrlife: "/catalog/brands/zeekr.jpg",
    "lynk-co": "/catalog/brands/lynk-co.jpg",
  };

  return covers[slug] ?? "";
}

function getCategoryLabel(category: VehicleCategory) {
  const labels: Record<VehicleCategory, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category];
}

function formatMileage(value: number | null) {
  if (value === null || value === undefined) {
    return "Kilometraje por confirmar";
  }

  return `${new Intl.NumberFormat("es-MX").format(value)} km`;
}

export default async function CatalogBrandPage({
  params,
  searchParams,
}: CatalogBrandPageProps) {
  const { marca } = await params;
  const filters = await searchParams;

  const brands = await prisma.brand.findMany({
    where: {
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const brand = brands.find((item) => getBrandSlug(item.name) === marca);

  if (!brand) {
    notFound();
  }

  const search = filters.q?.trim().toLowerCase() ?? "";
  const selectedType = filters.tipo ?? "TODOS";
  const selectedYear =
    filters.anio && filters.anio !== "TODOS" ? Number(filters.anio) : 0;
  const selectedBranch = filters.sucursal ?? "TODAS";

  const vehicles = await prisma.vehicle.findMany({
    where: {
      active: true,
      brandId: brand.id,
      condition: VehicleCondition.NUEVO,
      status: VehicleStatus.DISPONIBLE,
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
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const formattedVehicles = vehicles.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
    model: vehicle.model,
    category: vehicle.category,
    year: vehicle.year,
    price: vehicle.price,
    mileage: vehicle.mileage,
    branchId: vehicle.branchId,
    branchName: vehicle.branch.name,
    branchCity: vehicle.branch.city,
    branchWhatsapp: vehicle.branch.whatsapp,
    mainImage: vehicle.images[0]?.url || vehicle.mainImage || "",
  }));

  const availableYears = Array.from(
    new Set(formattedVehicles.map((vehicle) => vehicle.year).filter(Boolean))
  ).sort((a, b) => b - a);

  const availableBranches = Array.from(
    new Map(
      formattedVehicles.map((vehicle) => [
        `${vehicle.branchName}|${vehicle.branchCity}`,
        {
          value: `${vehicle.branchName}|${vehicle.branchCity}`,
          label: `${vehicle.branchName} · ${vehicle.branchCity}`,
        },
      ])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label));

  const filteredVehicles = formattedVehicles.filter((vehicle) => {
    const searchableText = [
      brand.name,
      vehicle.name,
      vehicle.model,
      vehicle.year,
      vehicle.branchName,
      vehicle.branchCity,
      getCategoryLabel(vehicle.category),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = search ? searchableText.includes(search) : true;

    const matchesType =
      selectedType !== "TODOS" ? vehicle.category === selectedType : true;

    const matchesYear = selectedYear ? vehicle.year === selectedYear : true;

    const branchValue = `${vehicle.branchName}|${vehicle.branchCity}`;
    const matchesBranch =
      selectedBranch !== "TODAS" ? branchValue === selectedBranch : true;

    return matchesSearch && matchesType && matchesYear && matchesBranch;
  });

  const hasFilters =
    Boolean(search) ||
    selectedType !== "TODOS" ||
    Boolean(selectedYear) ||
    selectedBranch !== "TODAS";

  const coverImage =
    getBrandCover(brand.name) ||
    formattedVehicles.find((vehicle) => vehicle.mainImage)?.mainImage ||
    "";

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="py-12 md:py-16">
        <Container>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[var(--rise-blue)]"
          >
            <ArrowLeft size={18} />
            Volver al catálogo
          </Link>

          <div className="mt-6 overflow-hidden rounded-[2.5rem] border border-[var(--rise-border)] bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1fr_0.9fr]">
              <div className="p-6 md:p-10">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Catálogo de marca
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
                  {brand.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                  Consulta vehículos nuevos disponibles de {brand.name}.
                  Revisa precio, sucursal, detalles y solicita información.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--rise-blue-soft)] px-4 py-2 text-sm font-black text-[var(--rise-blue)]">
                    <BadgeCheck size={17} />
                    Nuevos disponibles
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-500">
                    <Car size={17} />
                    {formattedVehicles.length} unidad(es)
                  </span>
                </div>
              </div>

              <div className="min-h-[280px] bg-slate-100">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={brand.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full min-h-[280px] place-items-center text-slate-400">
                    <ImageIcon size={56} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="buscar-modelos" className="scroll-mt-28 pb-12 md:pb-16">
        <Container>
          <div className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Vehículos disponibles
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                  Modelos nuevos {brand.name}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  Filtra por tipo, año, sucursal o busca por nombre del modelo.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-500">
                <SlidersHorizontal size={17} />
                {filteredVehicles.length} resultado(s)
              </div>
            </div>

            <form
              action={`/catalogo/${marca}#buscar-modelos`}
              className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
            >
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
                    defaultValue={filters.q ?? ""}
                    placeholder="Ej. Classic, Defender, RZR..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                  />
                </div>
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
                  <option value="TODOS">Todos</option>
                  <option value="AUTO">Autos</option>
                  <option value="MOTO">Motos</option>
                  <option value="TODOTERRENO">Todo terreno</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Año
                </span>

                <select
                  name="anio"
                  defaultValue={filters.anio ?? "TODOS"}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="TODOS">Todos</option>

                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Sucursal
                </span>

                <select
                  name="sucursal"
                  defaultValue={selectedBranch}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="TODAS">Todas</option>

                  {availableBranches.map((branch) => (
                    <option key={branch.value} value={branch.value}>
                      {branch.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--rise-navy)] px-6 text-sm font-black text-white transition hover:bg-[var(--rise-blue)] xl:self-end"
              >
                Buscar
              </button>
            </form>

            {hasFilters && (
              <div className="mt-4">
                <Link
                  href={`/catalogo/${marca}#buscar-modelos`}
                  className="text-sm font-black text-[var(--rise-blue)] hover:underline"
                >
                  Limpiar filtros
                </Link>
              </div>
            )}

            {filteredVehicles.length > 0 ? (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredVehicles.map((vehicle) => {
                  const vehicleName = `${brand.name} ${vehicle.name}`;

                  return (
                    <article
                      key={vehicle.id}
                      className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10"
                    >
                      <Link href={`/vehiculos/${vehicle.id}`}>
                        <div className="relative h-56 overflow-hidden bg-slate-100">
                          {vehicle.mainImage ? (
                            <img
                              src={vehicle.mainImage}
                              alt={vehicleName}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-slate-400">
                              <ImageIcon size={46} />
                            </div>
                          )}

                          <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--rise-blue)] shadow-sm">
                            Nuevo
                          </div>
                        </div>
                      </Link>

                      <div className="p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
                          {brand.name}
                        </p>

                        <Link href={`/vehiculos/${vehicle.id}`}>
                          <h3 className="mt-2 line-clamp-2 text-2xl font-black text-[var(--rise-navy)] transition hover:text-[var(--rise-blue)]">
                            {vehicle.name}
                          </h3>
                        </Link>

                        <div className="mt-4 grid gap-2 text-sm font-bold text-slate-500">
                          <div className="flex items-center gap-2">
                            <Tags
                              size={16}
                              className="text-[var(--rise-blue)]"
                            />
                            {getCategoryLabel(vehicle.category)}
                          </div>

                          <div className="flex items-center gap-2">
                            <Gauge
                              size={16}
                              className="text-[var(--rise-blue)]"
                            />
                            {formatMileage(vehicle.mileage)}
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin
                              size={16}
                              className="text-[var(--rise-blue)]"
                            />
                            {vehicle.branchCity}
                          </div>

                          <div className="flex items-center gap-2">
                            <Building2
                              size={16}
                              className="text-[var(--rise-blue)]"
                            />
                            {vehicle.branchName}
                          </div>
                        </div>

                        <p className="mt-5 text-2xl font-black text-[var(--rise-blue)]">
                          {formatCurrency(vehicle.price)}
                        </p>

                        <div className="mt-5 grid gap-3">
                          <VehicleLeadActions
                            vehicleId={vehicle.id}
                            branchId={vehicle.branchId}
                            vehicleName={vehicleName}
                            whatsapp={vehicle.branchWhatsapp}
                            mode="stack"
                          />

                          <Link
                            href={`/vehiculos/${vehicle.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
                          >
                            Ver detalle
                            <ArrowRight size={17} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Car className="mx-auto text-slate-400" size={50} />

                <h3 className="mt-4 text-2xl font-black">
                  No hay vehículos nuevos disponibles de {brand.name}.
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Cuando registres una unidad como Nuevo, Disponible y Visible,
                  aparecerá en esta sección.
                </p>

                <Link
                  href="/catalogo"
                  className="mt-5 inline-flex rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                >
                  Ver catálogo general
                </Link>
              </div>
            )}
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}