import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
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
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  formatCurrency,
} from "@/lib/formatters";

export const dynamic = "force-dynamic";

const VEHICLES_PER_PAGE = 12;

type BrandCatalogPageProps = {
  params: Promise<{
    marca: string;
  }>;

  searchParams: Promise<{
    q?: string;
    tipo?: string;
    precio?: string;
    orden?: string;
    pagina?: string;
  }>;
};

type BrandVehicle = {
  id: number;
  brandId: number;
  branchId: number;
  name: string;
  model: string;
  category: VehicleCategory;
  year: number;
  price: number;
  currency: "MXN" | "USD";
  mileage: number | null;
  description: string | null;
  mainImage: string | null;
  isFeatured: boolean;
  updatedAt: Date;

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

const categoryLabels: Record<VehicleCategory, string> = {
  AUTO: "Autos",
  MOTO: "Motocicletas",
  TODOTERRENO: "Todoterreno",
  NAUTICA: "Naútica"
};

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

  "Slingshot",
  "Polaris Slingshot",

  "Bennington",
  "Bennington Marine",
];

const priceFilters = [
  {
    label: "Todos los precios",
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

    Slingshot: "slingshot",
    "Polaris Slingshot": "slingshot",

    Bennington: "bennington",
    "Bennington Marine": "bennington",
  };

  return customSlugs[brandName] ?? slugifyBrand(brandName);
}

function getBrandLogo(brandName: string) {
  const logos: Record<string, string> = {
    "Can-Am": "/catalog/brands/can-am.png",
    Polaris: "/catalog/brands/polaris.jpg",

    "Sea-Doo": "/catalog/brands/sea-doo.jpg",
    "Sea Doo": "/catalog/brands/sea-doo.jpg",
    SeaDoo: "/catalog/brands/sea-doo.jpg",

    Triumph: "/catalog/brands/triumph.png",
    "Triumph Motorcycles": "/catalog/brands/triumph.png",

    "Royal Enfield": "/catalog/brands/royal-enfield.jpg",

    Indian: "/catalog/brands/indian.jpg",
    "Indian Motorcycle": "/catalog/brands/indian.jpg",

    Zeekr: "/catalog/brands/zeekNegro.png",
    Zeekrlife: "/catalog/brands/zeekNegro.png",

    "Lynk & Co": "/catalog/brands/lynkco.png",

    Slingshot:
      "/catalog/brands/slingshot.png",

    "Polaris Slingshot":
      "/catalog/brands/slingshot.png",

    Bennington:
      "/catalog/brands/bennington.png",

    "Bennington Marine":
      "/catalog/brands/bennington.png",
  };

  return logos[brandName] ?? null;
}

function getPriceFilter(value?: string) {
  return (
    priceFilters.find((filter) => filter.value === value) ??
    priceFilters[0]
  );
}

function sortVehicles(
  vehicles: BrandVehicle[],
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

    /*
     * Los destacados aparecen primero. Dentro de cada grupo
     * se ordenan por fecha de actualización.
     */
    if (a.isFeatured !== b.isFeatured) {
      return Number(b.isFeatured) - Number(a.isFeatured);
    }

    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

function buildBrandCatalogHref(
  brandSlug: string,
  params: {
    q?: string;
    tipo?: string;
    precio?: string;
    orden?: string;
    pagina?: number | string;
  }
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      String(value) !== ""
    ) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query
    ? `/catalogo/${brandSlug}?${query}`
    : `/catalogo/${brandSlug}`;
}

export default async function BrandCatalogPage({
  params,
  searchParams,
}: BrandCatalogPageProps) {
  const { marca } = await params;
  const queryParams = await searchParams;

  const currentSlug = String(marca ?? "").trim();

  const activeBrands = await prisma.brand.findMany({
    where: {
      active: true,
      name: {
        in: catalogBrandNames,
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const brand = activeBrands.find(
    (item) => getBrandSlug(item.name) === currentSlug
  );

  if (!brand) {
    notFound();
  }

  const query = String(queryParams.q ?? "").trim();
  const selectedType = String(
    queryParams.tipo ?? ""
  ).trim();
  const selectedPrice = String(
    queryParams.precio ?? ""
  ).trim();
  const selectedOrder = String(
    queryParams.orden ?? "recientes"
  ).trim();

  const requestedPage = Number.parseInt(
    String(queryParams.pagina ?? "1"),
    10
  );

  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const vehicles = (await prisma.vehicle.findMany({
    where: {
      active: true,
      brandId: brand.id,
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
  })) as BrandVehicle[];

  const brandSlug = getBrandSlug(brand.name);
  const brandLogo = getBrandLogo(brand.name);
  const priceFilter = getPriceFilter(selectedPrice);

  const filteredVehicles = sortVehicles(
    vehicles.filter((vehicle) => {
      const searchableText = normalize(
        [
          vehicle.brand.name,
          vehicle.name,
          vehicle.model,
          vehicle.description ?? "",
          vehicle.branch.name,
          vehicle.branch.city,
        ].join(" ")
      );

      const matchesQuery = query
        ? searchableText.includes(normalize(query))
        : true;

      const matchesType = selectedType
        ? vehicle.category === selectedType
        : true;

      const matchesPriceMin =
        priceFilter.min !== null
          ? vehicle.price >= priceFilter.min
          : true;

      const matchesPriceMax =
        priceFilter.max !== null
          ? vehicle.price <= priceFilter.max
          : true;

      return (
        matchesQuery &&
        matchesType &&
        matchesPriceMin &&
        matchesPriceMax
      );
    }),
    selectedOrder
  );

  const availableTypes = Array.from(
    new Set(vehicles.map((vehicle) => vehicle.category))
  );

  const totalVehicles = filteredVehicles.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalVehicles / VEHICLES_PER_PAGE)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * VEHICLES_PER_PAGE;

  const endIndex =
    startIndex + VEHICLES_PER_PAGE;

  const paginatedVehicles = filteredVehicles.slice(
    startIndex,
    endIndex
  );

  const firstVisibleVehicle =
    totalVehicles === 0 ? 0 : startIndex + 1;

  const lastVisibleVehicle = Math.min(
    endIndex,
    totalVehicles
  );

  const selectedOrderLabel =
    orderOptions.find(
      (option) => option.value === selectedOrder
    )?.label ?? "Más recientes";

  return (
    <>
      <Header />

      <main className="public-home">
        {/* Encabezado de marca */}
        <section className="relative overflow-hidden border-b border-white/10 bg-[var(--public-header)] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.035),transparent_45%)]" />

          <div className="absolute right-0 top-0 hidden h-full w-[38%] border-l border-white/[0.06] lg:block" />

          <div className="public-container relative grid min-h-[440px] items-center gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-20">
            <div className="max-w-4xl">
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-3 border-b border-white/20 pb-2 text-xs font-black uppercase tracking-[0.18em] !text-white/60 transition hover:border-white hover:!text-white"
              >
                <ArrowLeft size={16} />
                Volver a marcas
              </Link>

              <div className="mt-10 flex items-center gap-4">
                <span className="h-px w-10 bg-white" />

                <p className="text-xs font-black uppercase tracking-[0.22em] text-white">
                  Catálogo de marca
                </p>
              </div>

              <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.055em] md:text-6xl xl:text-7xl">
                Vehículos
                <span className="block text-white">
                  {brand.name}
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-white md:text-lg">
                Consulta únicamente las unidades nuevas disponibles de{" "}
                {brand.name}.
              </p>
            </div>

            <div className="flex justify-start lg:justify-end">
              <div className="relative flex min-h-[210px] w-full items-center justify-center border border-white/10 bg-[#eef0ee] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.18)] lg:min-h-[250px]">
                <div className="absolute inset-x-0 top-0 h-[3px] bg-[var(--public-accent)]" />

                {brandLogo ? (
                  <img
                    src={brandLogo}
                    alt={`Logo ${brand.name}`}
                    className="max-h-[145px] max-w-[90%] object-contain"
                  />
                ) : (
                  <span className="text-center text-3xl font-black text-[var(--public-ink)]">
                    {brand.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="public-container py-14 md:py-20">
          {/* Filtros */}
          <form
            action={`/catalogo/${brandSlug}`}
            className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] md:p-6"
          >
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="flex items-center gap-4">
                  <span className="h-px w-10 bg-[var(--public-accent)]" />

                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
                    Buscar y filtrar
                  </p>
                </div>

                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-4xl">
                  Encuentra tu {brand.name}
                </h2>
              </div>

              <Link
                href={`/catalogo/${brandSlug}`}
                className="inline-flex h-11 items-center justify-center border border-[var(--home-border-strong)] px-5 text-xs font-black uppercase tracking-[0.13em] text-[var(--public-ink)] transition hover:border-[var(--public-ink)] hover:bg-[var(--public-ink)] hover:!text-white"
              >
                Limpiar filtros
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
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
                    placeholder={`Buscar modelo ${brand.name}`}
                    className="h-12 w-full border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] pl-11 pr-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition focus:border-[var(--public-ink)] focus:bg-white" />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Categoría
                </span>

                <select
                  name="tipo"
                  defaultValue={selectedType}
                  className="h-12 w-full border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition focus:border-[var(--public-ink)] focus:bg-white"                >
                  <option value="">Todas</option>

                  {availableTypes.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
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
                  className="h-12 w-full border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition focus:border-[var(--public-ink)] focus:bg-white"                >
                  {priceFilters.map((filter) => (
                    <option
                      key={filter.value || "all"}
                      value={filter.value}
                    >
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
                  className="h-12 w-full border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition focus:border-[var(--public-ink)] focus:bg-white"                >
                  {orderOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-3 bg-[var(--public-header)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)] md:w-auto"
            >
              <SlidersHorizontal size={18} />
              Aplicar filtros
            </button>
          </form>

          {/* Encabezado de resultados */}
          <div className="mt-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#192a3a]" />

                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                  Resultados
                </p>
              </div>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                {totalVehicles} unidad
                {totalVehicles === 1 ? "" : "es"}{" "}
                {brand.name}
              </h2>

              {totalVehicles > 0 && (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Mostrando {firstVisibleVehicle}–
                  {lastVisibleVehicle} de {totalVehicles} vehículos
                </p>
              )}
            </div>

            <div className="inline-flex w-fit items-center gap-3 border border-[var(--home-border)] bg-[var(--home-card)] px-4 py-3 text-sm font-black text-[var(--public-muted)]">
              <ArrowUpDown size={17} />
              {selectedOrderLabel}
            </div>
          </div>

          {/* Listado */}
          <section className="mt-7">
            {totalVehicles > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <CatalogPagination
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    buildHref={(page) =>
                      buildBrandCatalogHref(
                        brandSlug,
                        {
                          q: query,
                          tipo: selectedType,
                          precio: selectedPrice,
                          orden: selectedOrder,
                          pagina: page,
                        }
                      )
                    }
                  />
                )}
              </>
            ) : (
              <div className="border border-dashed border-[var(--home-border-strong)] bg-[var(--home-card)] p-10 text-center">                <Search
                size={46}
                className="mx-auto text-slate-400"
              />

                <h3 className="mt-4 text-2xl font-black">
                  No encontramos unidades {brand.name}
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Intenta limpiar los filtros o buscar por otra
                  categoría, modelo o rango de precio.
                </p>

                <Link
                  href={`/catalogo/${brandSlug}`}
                  className="mt-6 inline-flex h-11 items-center justify-center bg-[var(--public-header)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
                >
                  Ver todo {brand.name}
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
}: {
  vehicle: BrandVehicle;
}) {
  const image =
    vehicle.mainImage ||
    vehicle.images[0]?.url ||
    "";

  return (
    <Link
      href={`/vehiculos/${vehicle.id}`}
      className="group relative block overflow-hidden border border-[var(--home-border)] bg-[var(--home-card)] shadow-[0_10px_28px_rgba(18,24,28,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[var(--home-border-strong)] hover:bg-[var(--home-card-hover)] hover:shadow-[var(--home-shadow)]"
    >
      <div className="absolute inset-x-0 top-0 z-20 h-[3px] origin-left scale-x-0 bg-[var(--public-accent)] transition-transform duration-300 group-hover:scale-x-100" />

      <div className="relative h-[260px] overflow-hidden bg-[var(--home-surface-alt)]">
        {image ? (
          <img
            src={image}
            alt={`${vehicle.brand.name} ${vehicle.name}`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon
              size={46}
              className="text-[var(--public-muted)]"
            />
          </div>
        )}

        {vehicle.isFeatured && (
          <span className="absolute left-0 top-5 bg-[var(--public-accent)] px-4 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-white">
            Destacado
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

        <span className="absolute bottom-0 right-0 grid h-12 w-12 place-items-center bg-[var(--public-header)] !text-white transition duration-300 group-hover:bg-[var(--public-accent)]">
          <ArrowRight
            size={18}
            className="text-white transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </span>
      </div>

      <div className="p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
          {vehicle.brand.name}
        </p>

        <h3 className="mt-3 line-clamp-2 min-h-[58px] text-2xl font-black leading-tight tracking-[-0.035em] text-[var(--public-ink)]">
          {vehicle.name}
        </h3>

        <div className="mt-5 grid grid-cols-2 gap-px border border-[var(--home-border)] bg-[var(--home-border)]">
          <div className="bg-[var(--home-card)] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
              Año
            </p>

            <p className="mt-1 font-black text-[var(--public-ink)]">
              {vehicle.year}
            </p>
          </div>

          <div className="bg-[var(--home-card)] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
              Categoría
            </p>

            <p className="mt-1 font-black text-[var(--public-ink)]">
              {categoryLabels[vehicle.category]}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-[var(--home-border)] pt-5">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
            Precio
          </p>

          <p className="mt-1 text-2xl font-black tracking-[-0.035em] text-[var(--public-ink)]">
            {formatCurrency(
              vehicle.price,
              vehicle.currency
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CatalogPagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  const pageNumbers = Array.from(
    new Set([
      1,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      totalPages,
    ])
  )
    .filter(
      (page) =>
        page >= 1 &&
        page <= totalPages
    )
    .sort((a, b) => a - b);

  return (
    <nav
      aria-label="Paginación del catálogo de marca"
      className="mt-12 border-t border-[var(--home-border)] pt-8"
    >
      <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--public-muted)]">
          Página {currentPage} de {totalPages}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {currentPage > 1 ? (
            <Link
              href={buildHref(currentPage - 1)}
              className="inline-flex h-11 items-center justify-center border border-[var(--home-border-strong)] bg-[var(--home-card)] px-5 text-xs font-black uppercase tracking-[0.12em] text-[var(--public-ink)] transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:!text-white"
            >
              Anterior
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex h-11 cursor-not-allowed items-center justify-center border border-[var(--home-border)] bg-[var(--home-surface-alt)] px-5 text-xs font-black uppercase tracking-[0.12em] text-[var(--public-muted)] opacity-50"
            >
              Anterior
            </span>
          )}

          {pageNumbers.map((page, index) => {
            const previousPage =
              pageNumbers[index - 1];

            const showSeparator =
              previousPage !== undefined &&
              page - previousPage > 1;

            const isCurrent =
              page === currentPage;

            return (
              <div
                key={page}
                className="flex items-center gap-2"
              >
                {showSeparator && (
                  <span className="px-1 text-sm font-black text-[var(--public-muted)]">
                    …
                  </span>
                )}

                <Link
                  href={buildHref(page)}
                  aria-current={
                    isCurrent
                      ? "page"
                      : undefined
                  }
                  className={`grid h-11 w-11 place-items-center border text-sm font-black transition ${isCurrent
                    ? "border-[var(--public-header)] bg-[var(--public-header)] !text-white"
                    : "border-[var(--home-border-strong)] bg-[var(--home-card)] text-[var(--public-ink)] hover:border-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:!text-white"
                    }`}
                >
                  {page}
                </Link>
              </div>
            );
          })}

          {currentPage < totalPages ? (
            <Link
              href={buildHref(currentPage + 1)}
              className="inline-flex h-11 items-center justify-center border border-[var(--home-border-strong)] bg-[var(--home-card)] px-5 text-xs font-black uppercase tracking-[0.12em] text-[var(--public-ink)] transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:!text-white"
            >
              Siguiente
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex h-11 cursor-not-allowed items-center justify-center border border-[var(--home-border)] bg-[var(--home-surface-alt)] px-5 text-xs font-black uppercase tracking-[0.12em] text-[var(--public-muted)] opacity-50"
            >
              Siguiente
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}