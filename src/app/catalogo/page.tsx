import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
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

type CatalogPageProps = {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    tipo?: string;
    anio?: string;
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
    "lynk-co": "/catalog/brands/lynkco.jpg",
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

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;

  const search = params.q?.trim().toLowerCase() ?? "";
  const selectedBrand = params.marca ?? "TODAS";
  const selectedType = params.tipo ?? "TODOS";
  const selectedYear =
    params.anio && params.anio !== "TODOS" ? Number(params.anio) : 0;

  const vehicles = await prisma.vehicle.findMany({
    where: {
      active: true,
      condition: VehicleCondition.NUEVO,
      status: VehicleStatus.DISPONIBLE,
      branch: {
        active: true,
      },
      brand: {
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

  const formattedVehicles = vehicles.map((vehicle) => {
    const brandSlug = getBrandSlug(vehicle.brand.name);

    return {
      id: vehicle.id,
      name: vehicle.name,
      model: vehicle.model,
      brandName: vehicle.brand.name,
      brandSlug,
      category: vehicle.category,
      year: vehicle.year,
      price: vehicle.price,
      mileage: vehicle.mileage,
      branchId: vehicle.branchId,
      branchName: vehicle.branch.name,
      branchCity: vehicle.branch.city,
      branchWhatsapp: vehicle.branch.whatsapp,
      mainImage: vehicle.images[0]?.url || vehicle.mainImage || "",
    };
  });

  const brands = Array.from(
    new Map(
      formattedVehicles.map((vehicle) => [
        vehicle.brandSlug,
        {
          name: vehicle.brandName,
          slug: vehicle.brandSlug,
          image: getBrandCover(vehicle.brandName) || vehicle.mainImage,
          total: formattedVehicles.filter(
            (item) => item.brandSlug === vehicle.brandSlug
          ).length,
        },
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const availableYears = Array.from(
    new Set(formattedVehicles.map((vehicle) => vehicle.year).filter(Boolean))
  ).sort((a, b) => b - a);

  const filteredVehicles = formattedVehicles.filter((vehicle) => {
    const searchableText = [
      vehicle.brandName,
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

    const matchesBrand =
      selectedBrand !== "TODAS" ? vehicle.brandSlug === selectedBrand : true;

    const matchesType =
      selectedType !== "TODOS" ? vehicle.category === selectedType : true;

    const matchesYear = selectedYear ? vehicle.year === selectedYear : true;

    return matchesSearch && matchesBrand && matchesType && matchesYear;
  });

  const groupedVehicles = brands
    .map((brand) => ({
      brand,
      vehicles: filteredVehicles.filter(
        (vehicle) => vehicle.brandSlug === brand.slug
      ),
    }))
    .filter((group) => group.vehicles.length > 0);

  const hasFilters =
    Boolean(search) ||
    selectedBrand !== "TODAS" ||
    selectedType !== "TODOS" ||
    Boolean(selectedYear);

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="py-12 md:py-16">
        <Container>
          <div className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-10">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Catálogo
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
              Vehículos nuevos disponibles
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Explora unidades nuevas disponibles por marca. Consulta precio,
              sucursal, detalles y solicita información directamente desde cada
              vehículo.
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
        </Container>
      </section>

      <section className="pb-8">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/catalogo/${brand.slug}`}
                className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
              >
                <div className="h-40 overflow-hidden bg-slate-100">
                  {brand.image ? (
                    <img
                      src={brand.image}
                      alt={brand.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-400">
                      <ImageIcon size={40} />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
                    Marca
                  </p>

                  <h2 className="mt-2 text-2xl font-black">{brand.name}</h2>

                  <p className="mt-2 text-sm font-bold text-slate-500">
                    {brand.total} vehículo(s) nuevo(s)
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section id="buscar-modelos" className="scroll-mt-28 pb-12 md:pb-16">
        <Container>
          <div className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Buscar vehículos
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                  Encuentra tu próximo vehículo
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  Filtra por marca, tipo, año o busca directamente por nombre
                  del modelo.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-500">
                <SlidersHorizontal size={17} />
                {filteredVehicles.length} resultado(s)
              </div>
            </div>

            <form
              action="/catalogo#buscar-modelos"
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
                    defaultValue={params.q ?? ""}
                    placeholder="Ej. RZR, Classic, Defender..."
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
                  <option value="TODAS">Todas</option>

                  {brands.map((brand) => (
                    <option key={brand.slug} value={brand.slug}>
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
                  defaultValue={params.anio ?? "TODOS"}
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
                  href="/catalogo#buscar-modelos"
                  className="text-sm font-black text-[var(--rise-blue)] hover:underline"
                >
                  Limpiar filtros
                </Link>
              </div>
            )}

            {groupedVehicles.length > 0 ? (
              <div className="mt-10 grid gap-10">
                {groupedVehicles.map((group) => (
                  <section key={group.brand.slug}>
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                        {group.brand.name}
                      </p>

                      <h3 className="mt-2 text-3xl font-black tracking-tight">
                        {group.vehicles.length} vehículo(s) nuevo(s)
                      </h3>
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {group.vehicles.map((vehicle) => {
                        const vehicleName = `${vehicle.brandName} ${vehicle.name}`;

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
                                {vehicle.brandName}
                              </p>

                              <Link href={`/vehiculos/${vehicle.id}`}>
                                <h4 className="mt-2 line-clamp-2 text-2xl font-black text-[var(--rise-navy)] transition hover:text-[var(--rise-blue)]">
                                  {vehicle.name}
                                </h4>
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
                  </section>
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Car className="mx-auto text-slate-400" size={50} />

                <h3 className="mt-4 text-2xl font-black">
                  No encontramos vehículos nuevos con esos filtros.
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Intenta buscar por otra marca, año o tipo de vehículo.
                </p>

                <Link
                  href="/catalogo#buscar-modelos"
                  className="mt-5 inline-flex rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                >
                  Limpiar filtros
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