import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
} from "lucide-react";
import {
  VehicleCondition,
  VehicleStatus,
} from "@prisma/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import { BranchCoverViewer } from "@/components/branches/BranchCoverViewer";

export const dynamic = "force-dynamic";

const BRANCHES_PER_PAGE = 6;

type BranchesPageProps = {
  searchParams: Promise<{
    q?: string;
    ciudad?: string;
    pagina?: string;
  }>;
};

function cleanPhone(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function getWhatsAppHref(
  phone?: string | null,
  message?: string
) {
  const phoneNumber = cleanPhone(phone);

  if (!phoneNumber) {
    return "";
  }

  const finalPhone = phoneNumber.startsWith("52")
    ? phoneNumber
    : `52${phoneNumber}`;

  const text = message
    ? `?text=${encodeURIComponent(message)}`
    : "";

  return `https://wa.me/${finalPhone}${text}`;
}

function getMapExternalUrl(branch: {
  address: string;
  city: string;
  state: string;
  googleMapsUrl?: string | null;
}) {
  if (branch.googleMapsUrl?.trim()) {
    return branch.googleMapsUrl;
  }

  const location = [
    branch.address,
    branch.city,
    branch.state,
  ]
    .filter(Boolean)
    .join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    location
  )}`;
}

function splitServices(value?: string | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildBranchesHref(params: {
  q?: string;
  ciudad?: string;
  pagina?: number | string;
}) {
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
    ? `/sucursales?${query}`
    : "/sucursales";
}

export default async function BranchesPage({
  searchParams,
}: BranchesPageProps) {
  const params = await searchParams;

  const query = String(params.q ?? "").trim();
  const selectedCity = String(
    params.ciudad ?? ""
  ).trim();

  const requestedPage = Number.parseInt(
    String(params.pagina ?? "1"),
    10
  );

  const currentPage =
    Number.isFinite(requestedPage) &&
      requestedPage > 0
      ? requestedPage
      : 1;

  const branches = await prisma.branch.findMany({
    where: {
      active: true,
    },

    include: {
      vehicles: {
        where: {
          active: true,
          status: VehicleStatus.DISPONIBLE,

          brand: {
            active: true,
          },
        },

        select: {
          id: true,
          condition: true,
        },
      },
    },

    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        city: "asc",
      },
    ],
  });

  const cities = Array.from(
    new Set(
      branches
        .map((branch) => branch.city)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const filteredBranches = branches.filter(
    (branch) => {
      const searchableText = normalize(
        [
          branch.name,
          branch.address,
          branch.city,
          branch.state,
          branch.services ?? "",
        ].join(" ")
      );

      const matchesQuery = query
        ? searchableText.includes(normalize(query))
        : true;

      const matchesCity = selectedCity
        ? branch.city === selectedCity
        : true;

      return matchesQuery && matchesCity;
    }
  );

  const totalVehicles = branches.reduce(
    (total, branch) =>
      total + branch.vehicles.length,
    0
  );

  const totalNewVehicles = branches.reduce(
    (total, branch) =>
      total +
      branch.vehicles.filter(
        (vehicle) =>
          vehicle.condition ===
          VehicleCondition.NUEVO
      ).length,
    0
  );

  const totalUsedVehicles = branches.reduce(
    (total, branch) =>
      total +
      branch.vehicles.filter(
        (vehicle) =>
          vehicle.condition ===
          VehicleCondition.SEMINUEVO
      ).length,
    0
  );

  const totalResults = filteredBranches.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalResults / BRANCHES_PER_PAGE
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) *
    BRANCHES_PER_PAGE;

  const endIndex =
    startIndex + BRANCHES_PER_PAGE;

  const paginatedBranches =
    filteredBranches.slice(
      startIndex,
      endIndex
    );

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
                Sucursales Grupo Rise
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.045em] md:text-5xl lg:text-6xl">
                Encuentra tu agencia más cercana
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/65 md:text-base">
                Consulta nuestras ubicaciones,
                servicios y medios de contacto para
                recibir atención personalizada.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/catalogo"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
                >
                  Ver catálogo nuevo

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                  />
                </Link>

                <Link
                  href="/inventario"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 active:scale-[0.98]"
                >
                  Ver seminuevos

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-5 py-10 md:px-8 lg:px-10 lg:py-12">
          {/* Filtros */}
          <form
            action="/sucursales"
            className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)] md:p-6"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-[#192a3a]" />

                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                    Directorio de agencias
                  </p>
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] md:text-3xl">
                  Encuentra una sucursal
                </h2>
              </div>

              <Link
                href="/sucursales"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-black uppercase tracking-[0.13em] text-slate-600 transition hover:border-[#192a3a] hover:bg-white hover:text-[#192a3a] active:scale-[0.98]"
              >
                Limpiar filtros
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_280px_auto] md:items-end">
              <label>
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
                    placeholder="Nombre, ciudad, estado o servicio"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#192a3a] focus:bg-white"
                  />
                </div>
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Ciudad
                </span>

                <select
                  name="ciudad"
                  defaultValue={selectedCity}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[#192a3a] focus:bg-white"
                >
                  <option value="">
                    Todas las ciudades
                  </option>

                  {cities.map((city) => (
                    <option
                      key={city}
                      value={city}
                    >
                      {city}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-6 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
              >
                <Search size={17} />
                Buscar
              </button>
            </div>
          </form>

          {/* Resultados */}
          <div className="mt-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#192a3a]" />

                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                  Agencias disponibles
                </p>
              </div>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                {totalResults} sucursal
                {totalResults === 1 ? "" : "es"} encontrada
                {totalResults === 1 ? "" : "s"}
              </h2>
            </div>
          </div>

          {paginatedBranches.length > 0 ? (
            <>
              <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {paginatedBranches.map(
                  (branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                    />
                  )
                )}
              </div>

              {totalPages > 1 && (
                <BranchesPagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  buildHref={(page) =>
                    buildBranchesHref({
                      q: query,
                      ciudad: selectedCity,
                      pagina: page,
                    })
                  }
                />
              )}
            </>
          ) : (
            <div className="mt-8 rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <Building2
                size={50}
                className="mx-auto text-slate-400"
              />

              <h3 className="mt-4 text-2xl font-black">
                No encontramos sucursales
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Intenta limpiar los filtros o buscar
                por otra ciudad, estado o nombre.
              </p>

              <Link
                href="/sucursales"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
              >
                Ver todas las sucursales
              </Link>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

function HeaderMetric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="inline-flex items-baseline gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
      <span className="text-sm font-black text-white">
        {value}
      </span>

      <span className="text-[10px] font-black uppercase tracking-[0.13em] text-white/55">
        {label}
      </span>
    </div>
  );
}

type BranchCardProps = {
  branch: Awaited<
    ReturnType<typeof prisma.branch.findMany>
  >[number] & {
    vehicles: {
      id: number;
      condition: VehicleCondition;
    }[];
  };
};

function BranchCard({
  branch,
}: BranchCardProps) {
  const services = splitServices(
    branch.services
  ).slice(0, 2);

  const whatsappHref = getWhatsAppHref(
    branch.whatsapp,
    `Hola, me gustaría recibir información de ${branch.name}.`
  );

  const mapExternalUrl =
    getMapExternalUrl(branch);

  return (
    <article className="group overflow-hidden rounded-[20px] border border-black/8 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-1 hover:border-[#192a3a]/40 hover:shadow-[0_22px_55px_rgba(15,23,42,0.1)] active:border-[#192a3a]/40">
      <BranchCoverViewer
        coverImageUrl={branch.coverImageUrl}
        logoUrl={branch.logoUrl}
        branchName={branch.name}
        heightClassName="h-[205px]"
        showTitle={false}
      />

      <div className="p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#192a3a]">
          {branch.city}, {branch.state}
        </p>

        <Link
          href={`/sucursales/${branch.id}`}
        >
          <h3 className="mt-2 line-clamp-2 min-h-[52px] text-2xl font-black leading-tight tracking-[-0.035em] text-[#0a0f14] transition hover:text-[#192a3a]">
            {branch.name}
          </h3>
        </Link>

        <div className="mt-4 flex items-start gap-2.5">
          <MapPin
            size={16}
            className="mt-0.5 shrink-0 text-[#192a3a]"
          />

          <p className="line-clamp-2 min-h-[40px] text-xs font-semibold leading-5 text-slate-500">
            {branch.address}
          </p>
        </div>

        {branch.phone && (
          <div className="mt-3 flex items-center gap-2.5">
            <Phone
              size={15}
              className="shrink-0 text-[#192a3a]"
            />

            <p className="text-xs font-bold text-slate-600">
              {branch.phone}
            </p>
          </div>
        )}

        {services.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {services.map((service) => (
              <span
                key={service}
                className="rounded-full bg-[#e7edf1] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#192a3a]"
              >
                {service}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-y border-slate-100 py-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
              Inventario
            </p>

            <p className="mt-1 text-sm font-black text-slate-700">
              {branch.vehicles.length} unidades
            </p>
          </div>

          <Building2
            size={20}
            className="text-[#192a3a]"
          />
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link
            href={`/sucursales/${branch.id}`}
            className="group/link inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-4 text-xs font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
          >
            Ver agencia

            <ArrowRight
              size={15}
              className="transition-transform group-hover/link:translate-x-0.5 group-active/link:translate-x-0.5"
            />
          </Link>

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-100 active:scale-[0.98]"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          ) : (
            <a
              href={mapExternalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              <MapPin size={16} />
              Ubicación
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function BranchesPagination({
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
        page >= 1 && page <= totalPages
    )
    .sort((a, b) => a - b);

  return (
    <nav
      aria-label="Paginación de sucursales"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
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
        const previousPage =
          pageNumbers[index - 1];

        const showSeparator =
          previousPage !== undefined &&
          page - previousPage > 1;

        return (
          <div
            key={page}
            className="flex items-center gap-2"
          >
            {showSeparator && (
              <span className="px-1 text-sm font-black text-slate-400">
                …
              </span>
            )}

            <Link
              href={buildHref(page)}
              aria-current={
                page === currentPage
                  ? "page"
                  : undefined
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