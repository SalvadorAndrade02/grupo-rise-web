import Link from "next/link";
import {
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

export const dynamic = "force-dynamic";

type CatalogPageProps = {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    categoria?: string;
    tipo?: string;
    precio?: string;
    orden?: string;
    pagina?: string;
  }>;
};

const RISE_BLUE = "#192a3a";
const RISE_BLUE_DARK = "#101c27";
const RISE_BLUE_SOFT = "#e7edf1";
const RISE_BG = "#f4f6f7";

const VEHICLES_PER_PAGE = 12;

const categoryLabels: Record<VehicleCategory, string> = {
  AUTO: "Autos",
  MOTO: "Motos",
  TODOTERRENO: "Todoterreno",
};

const catalogBrandNames = [
  "Can-Am",
  "Polaris",
  "Sea-Doo",
  "Triumph",
  "Triumph Motorcycles",
  "Royal Enfield",
  "Indian",
  "Indian Motorcycle",
  "Zeekr",
  "Lynk & Co",
];

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

    Indian: "indian-motorcycle",
    "Indian Motorcycle": "indian-motorcycle",

    "Royal Enfield": "royal-enfield",
    Zeekr: "zeekrlife",
    Zeekrlife: "zeekrlife",
    "Lynk & Co": "lynk-co",
  };

  return customSlugs[brandName] ?? slugifyBrand(brandName);
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

function buildCatalogHref(params: {
  q?: string;
  marca?: string;
  categoria?: string;
  precio?: string;
  orden?: string;
  pagina?: number | string;
}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      searchParams.set(key, String(value));
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

  // Soporta ambos nombres:
  // /catalogo?categoria=AUTO
  // /catalogo?tipo=AUTO
  const selectedCategory = String(params.categoria ?? params.tipo ?? "").trim();

  const selectedPrice = String(params.precio ?? "").trim();
  const selectedOrder = String(params.orden ?? "recientes").trim();

  const requestedPage = Number.parseInt(String(params.pagina ?? "1"), 10);

  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

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
        name: {
          in: catalogBrandNames,
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

      const matchesCategory = selectedCategory
        ? vehicle.category === selectedCategory
        : true;

      const matchesPriceMin =
        priceFilter.min !== null ? vehicle.price >= priceFilter.min : true;

      const matchesPriceMax =
        priceFilter.max !== null ? vehicle.price <= priceFilter.max : true;

      return (
        matchesQuery &&
        matchesBrand &&
        matchesCategory &&
        matchesPriceMin &&
        matchesPriceMax
      );
    }),
    selectedOrder
  );

  const totalVehicles = filteredVehicles.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalVehicles / VEHICLES_PER_PAGE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex =
    (safeCurrentPage - 1) * VEHICLES_PER_PAGE;

  const endIndex = startIndex + VEHICLES_PER_PAGE;

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

  const totalBrands = new Set(vehicles.map((vehicle) => vehicle.brandId)).size;

  const brandCards = brands.map((brand) => {
    const brandVehicles = vehicles.filter(
      (vehicle) => vehicle.brandId === brand.id
    );

    return {
      id: brand.id,
      name: brand.name,
      slug: getBrandSlug(brand.name),
      count: brandVehicles.length,
      logo: getBrandLogo(brand.name),
    };
  });

  const selectedOrderLabel =
    orderOptions.find((option) => option.value === selectedOrder)?.label ??
    "Más recientes";

  return (
    <>
      <Header />

      <main className="bg-[#f4f6f7] text-[#0a0f14]">
        {/* Encabezado */}
        <section className="relative overflow-hidden bg-[#192a3a] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.96),rgba(25,42,58,0.94))]" />

          <div className="relative mx-auto w-full max-w-[1440px] px-5 py-14 md:px-8 lg:px-10 lg:py-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#dfe7ec] backdrop-blur-sm">
                <Sparkles size={15} />
                Catálogo Grupo Rise
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.045em] md:text-5xl lg:text-6xl">
                Vehículos nuevos disponibles.
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/65 md:text-base">
                Explora unidades nuevas por marca, categoría y rango de precio.
                Filtra el catálogo y entra al detalle para solicitar más
                información.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-5 py-10 md:px-8 lg:px-10 lg:py-12">
          {/* Marcas */}
          <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] md:p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-[#192a3a]" />

                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                    Explora por marca
                  </p>
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] md:text-3xl">
                  Marcas disponibles
                </h2>
              </div>

              <Link
                href="/catalogo"
                className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 text-xs font-black uppercase tracking-[0.14em] transition active:scale-[0.98] ${selectedBrand
                  ? "border-slate-200 bg-white text-slate-600 hover:border-[#192a3a] hover:text-[#192a3a]"
                  : "border-[#192a3a] bg-[#192a3a] text-white"
                  }`}
              >
                Todas
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 border-l border-t border-slate-200 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
              {brandCards.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/catalogo/${brand.slug}`}
                  title={brand.name}
                  aria-label={`Ver catálogo de ${brand.name}`}
                  className="group relative flex min-h-[118px] items-center justify-center overflow-hidden border-b border-r border-slate-200 bg-white px-5 py-6 transition duration-300 hover:z-10 hover:bg-[#f1f5f7] active:bg-[#e7edf1]"
                >
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={`Logo ${brand.name}`}
                      className="max-h-[56px] w-full object-contain grayscale transition duration-300 group-hover:scale-105 group-hover:grayscale-0 group-active:scale-105 group-active:grayscale-0"
                    />
                  ) : (
                    <span className="text-center text-sm font-black text-[#192a3a]">
                      {brand.name}
                    </span>
                  )}

                  <span className="absolute bottom-0 left-0 h-[3px] w-0 bg-[#192a3a] transition-all duration-300 group-hover:w-full group-active:w-full" />
                </Link>
              ))}
            </div>
          </section>

          {/* Filtros */}
          <form
            action="/catalogo"
            className="mt-7 rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] md:p-6"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-[#192a3a]" />

                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                    Buscar y filtrar
                  </p>
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] md:text-3xl">
                  Encuentra tu siguiente vehículo
                </h2>
              </div>

              <Link
                href="/catalogo"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-[#192a3a] hover:bg-white hover:text-[#192a3a] active:scale-[0.98]"
              >
                Limpiar filtros
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_repeat(4,minmax(0,1fr))]">
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
                    placeholder="Modelo, marca o sucursal"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#192a3a] focus:bg-white"
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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[#192a3a] focus:bg-white"
                >
                  <option value="">Todas</option>

                  {brands.map((brand) => (
                    <option
                      key={brand.id}
                      value={brand.id}
                    >
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Categoría
                </span>

                <select
                  name="categoria"
                  defaultValue={selectedCategory}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[#192a3a] focus:bg-white"
                >
                  <option value="">Todas</option>

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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[#192a3a] focus:bg-white"
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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[#192a3a] focus:bg-white"
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
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0a0f14] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#192a3a] active:scale-[0.98] md:w-auto"
            >
              <SlidersHorizontal size={18} />
              Aplicar filtros
            </button>
          </form>

          {/* Resultados */}
          <div className="mt-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#192a3a]" />

                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                  Resultados
                </p>
              </div>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                {filteredVehicles.length} unidad
                {filteredVehicles.length === 1 ? "" : "es"} encontrada
                {filteredVehicles.length === 1 ? "" : "s"}
              </h2>

              {totalVehicles > 0 && (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Mostrando {firstVisibleVehicle}–{lastVisibleVehicle} de{" "}
                  {totalVehicles} vehículos
                </p>
              )}
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600">
              <ArrowUpDown size={17} />
              {selectedOrderLabel}
            </div>
          </div>

          <section className="mt-7">
            {filteredVehicles.length > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedVehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <CatalogPagination
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    buildHref={(pagina) =>
                      buildCatalogHref({
                        q: query,
                        marca: selectedBrand,
                        categoria: selectedCategory,
                        precio: selectedPrice,
                        orden: selectedOrder,
                        pagina,
                      })
                    }
                  />
                )}
              </>
            ) : (
              <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center">
                <Search size={46} className="mx-auto text-slate-400" />

                <h3 className="mt-4 text-2xl font-black">
                  No encontramos vehículos con esos filtros
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Intenta limpiar los filtros o buscar por otra marca, categoría
                  o rango de precio.
                </p>

                <Link
                  href="/catalogo"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#0a0f14] px-5 text-sm font-black text-white transition hover:bg-[#192a3a] active:scale-[0.98]"
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
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return (
    <nav
      aria-label="Paginación del catálogo"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          scroll
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#192a3a] hover:text-white active:scale-[0.98]"
        >
          Anterior
        </Link>
      ) : (
        <span className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          Anterior
        </span>
      )}

      {pageNumbers.map((page, index) => {
        const previousPage = pageNumbers[index - 1];
        const showSeparator =
          previousPage !== undefined &&
          page - previousPage > 1;

        return (
          <div key={page} className="flex items-center gap-2">
            {showSeparator && (
              <span className="px-1 text-sm font-black text-slate-400">
                …
              </span>
            )}

            <Link
              href={buildHref(page)}
              aria-current={
                page === currentPage ? "page" : undefined
              }
              className={`grid h-11 w-11 place-items-center rounded-xl border text-sm font-black transition active:scale-95 ${page === currentPage
                ? "border-[#192a3a] bg-[#192a3a] text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#192a3a] hover:text-[#192a3a]"
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
          scroll
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#192a3a] hover:text-white active:scale-[0.98]"
        >
          Siguiente
        </Link>
      ) : (
        <span className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          Siguiente
        </span>
      )}
    </nav>
  );
}

function VehicleCard({
  vehicle,
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
}) {
  const image = vehicle.mainImage || vehicle.images[0]?.url || "";

  return (
    <Link
      href={`/vehiculos/${vehicle.id}`}
      className="group block overflow-hidden rounded-[20px] border border-black/8 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-1 hover:border-[#192a3a]/50 hover:shadow-[0_22px_55px_rgba(15,23,42,0.1)] active:border-[#192a3a]/50"
    >
      <div className="relative h-[250px] overflow-hidden bg-[#e8ecef]">
        {image ? (
          <img
            src={image}
            alt={vehicle.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045] group-active:scale-[1.045]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon size={46} className="text-slate-400" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent opacity-80" />

        <div className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white text-[#0a0f14] shadow-lg transition duration-300 group-hover:bg-[#192a3a] group-hover:text-white group-active:bg-[#192a3a] group-active:text-white">
          <ArrowRight
            size={17}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-active:translate-x-0.5"
          />
        </div>
      </div>

      <div className="p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#192a3a]">
          {vehicle.brand.name}
        </p>

        <h3 className="mt-2 line-clamp-2 min-h-[58px] text-2xl font-black leading-tight tracking-[-0.035em] text-[#0a0f14]">
          {vehicle.name}
        </h3>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Precio
          </p>

          <p className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#0a0f14]">
            {formatMoney(vehicle.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}