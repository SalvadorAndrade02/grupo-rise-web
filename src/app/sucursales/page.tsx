import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
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

function getBranchBrandReferences(branchName: string) {
  const name = normalize(branchName);

  if (name.includes("bikes and boats")) {
    return ["Can-Am", "Sea-Doo"];
  }

  if (name.includes("polaris")) {
    return ["Polaris"];
  }

  if (name.includes("indian motorcycle")) {
    return ["Indian Motorcycle"];
  }

  if (name.includes("triumph")) {
    return ["Triumph"];
  }

  if (name.includes("royal enfield")) {
    return ["Royal Enfield"];
  }

  if (name.includes("moto plex")) {
    return ["Moto Plex"];
  }

  if (name.includes("zeekr")) {
    return ["ZEEKR"];
  }

  if (
    name.includes("lynk&co") ||
    name.includes("lynk & co") ||
    name.includes("lynkco")
  ) {
    return ["Lynk & Co"];
  }

  return [];
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
          ...getBranchBrandReferences(branch.name),
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

      <main className="public-home">
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b border-white/10 bg-[var(--public-header)] text-white">
          {/* Imagen del encabezado */}
          <Image
            src="/images/sucursales/sucursales-header.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-30 object-cover object-center"
          />

          {/* Capa oscura para proteger el texto */}
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(8,12,16,0.92)_0%,rgba(8,12,16,0.76)_50%,rgba(8,12,16,0.38)_100%)]" />

          {/* Capa general ligera */}
          <div className="absolute inset-0 -z-10 bg-black/10" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.035),transparent_45%)]" />

          <div className="absolute right-0 top-0 hidden h-full w-[38%] border-l border-white/[0.06] lg:block" />

          <div className="public-container relative grid min-h-[460px] items-center gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-24">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-[var(--public-accent)]" />

                <p className="text-xs font-black uppercase tracking-[0.24em] text-white">
                  Agencias Grupo RISE
                </p>
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.055em] text-white md:text-6xl xl:text-7xl">
                Encuentra la agencia
                <span className="block text-white">
                  más cercana.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-8 text-white md:text-lg">
                Consulta nuestras ubicaciones, medios de contacto y
                servicios disponibles para recibir atención personalizada.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/catalogo"
                  className="group inline-flex h-12 items-center justify-center gap-3 bg-[var(--public-accent)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
                >
                  Explorar marcas

                  <ArrowRight
                    size={17}
                    className="text-white transition-transform group-hover:translate-x-0.5"
                  />
                </Link>

                <Link
                  href="/contacto"
                  className="inline-flex h-12 items-center justify-center border border-white/20 px-6 text-sm font-black !text-white transition hover:border-white hover:bg-white hover:!text-[var(--public-header)]"
                >
                  Contactar asesor
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Introducción */}
        <section className="border-b border-[var(--home-border)] bg-[var(--home-background)]">
          <div className="public-container py-16 md:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="public-eyebrow">
                  Directorio de agencias
                </p>

                <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[var(--public-ink)] md:text-6xl">
                  Estamos cerca de ti.
                </h2>
              </div>

              <div className="border-l-2 border-[var(--public-accent)] pl-6 md:pl-10">
                <p className="max-w-2xl text-base leading-8 text-[var(--public-muted)] md:text-lg">
                  Selecciona una agencia para consultar su dirección,
                  información de contacto, ubicación y servicios
                  disponibles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Búsqueda y resultados */}
        <section className="bg-[var(--home-surface)]">
          <div className="public-container py-14 md:py-20">
            <form
              action="/sucursales"
              className="border border-[var(--home-border)] bg-[var(--home-card)] p-6 shadow-[0_12px_30px_rgba(18,24,28,0.05)] md:p-8"
            >
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <div className="flex items-center gap-4">
                    <span className="h-px w-10 bg-[var(--public-accent)]" />

                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
                      Buscar ubicación
                    </p>
                  </div>

                  <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-4xl">
                    Encuentra una sucursal
                  </h2>
                </div>

                <Link
                  href="/sucursales"
                  className="inline-flex h-11 items-center justify-center border border-[var(--home-border-strong)] px-5 text-xs font-black uppercase tracking-[0.13em] text-[var(--public-ink)] transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:!text-white"
                >
                  Limpiar filtros
                </Link>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-[minmax(0,1fr)_280px_auto] md:items-end">
                <label>
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--public-muted)]">
                    Buscar
                  </span>

                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--public-muted)]"
                    />

                    <input
                      name="q"
                      defaultValue={query}
                      placeholder="Nombre, ciudad, estado o servicio"
                      className="h-12 w-full border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] pl-11 pr-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition placeholder:text-[var(--public-muted)] focus:border-[var(--public-header)] focus:bg-white"
                    />
                  </div>
                </label>

                <label>
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--public-muted)]">
                    Ciudad
                  </span>

                  <select
                    name="ciudad"
                    defaultValue={selectedCity}
                    className="h-12 w-full border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition focus:border-[var(--public-header)] focus:bg-white"
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
                  className="inline-flex h-12 items-center justify-center gap-3 bg-[var(--public-header)] px-7 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
                >
                  <Search size={17} />
                  Buscar
                </button>
              </div>
            </form>

            {/* Encabezado de resultados */}
            <div className="mt-14 flex flex-col justify-between gap-5 border-b border-[var(--home-border)] pb-7 md:flex-row md:items-end">
              <div>
                <div className="flex items-center gap-4">
                  <span className="h-px w-10 bg-[var(--public-accent)]" />

                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
                    Agencias disponibles
                  </p>
                </div>

                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-5xl">
                  {totalResults} sucursal
                  {totalResults === 1 ? "" : "es"} encontrada
                  {totalResults === 1 ? "" : "s"}
                </h2>
              </div>

              <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--public-muted)]">
                Página {safeCurrentPage} de {totalPages}
              </p>
            </div>

            {paginatedBranches.length > 0 ? (
              <>
                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedBranches.map((branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                    />
                  ))}
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
              <div className="mt-8 border border-dashed border-[var(--home-border-strong)] bg-[var(--home-card)] p-10 text-center md:p-14">
                <Building2
                  size={50}
                  className="mx-auto text-[var(--public-muted)]"
                />

                <h3 className="mt-5 text-2xl font-black text-[var(--public-ink)] md:text-3xl">
                  No encontramos sucursales
                </h3>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[var(--public-muted)]">
                  Intenta limpiar los filtros o buscar por otra ciudad,
                  estado, servicio o nombre.
                </p>

                <Link
                  href="/sucursales"
                  className="mt-6 inline-flex h-11 items-center justify-center bg-[var(--public-header)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
                >
                  Ver todas las sucursales
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
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
  ).slice(0, 3);

  const brandReferences =
    getBranchBrandReferences(branch.name);

  const whatsappHref = getWhatsAppHref(
    branch.whatsapp,
    `Hola, me gustaría recibir información de ${branch.name}.`
  );

  const mapExternalUrl =
    getMapExternalUrl(branch);

  return (
    <article className="group relative overflow-hidden border border-[var(--home-border)] bg-[var(--home-card)] shadow-[0_10px_28px_rgba(18,24,28,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[var(--home-border-strong)] hover:shadow-[var(--home-shadow)]">
      <div className="absolute inset-x-0 top-0 z-20 h-[3px] origin-left scale-x-0 bg-[var(--public-accent)] transition-transform duration-300 group-hover:scale-x-100" />

      <BranchCoverViewer
        coverImageUrl={branch.coverImageUrl}
        logoUrl={branch.logoUrl}
        branchName={branch.name}
        heightClassName="h-[230px]"
        showTitle={false}
      />

      <div className="p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
          {branch.city}, {branch.state}
        </p>

        <Link
          href={`/sucursales/${branch.id}`}
          className="block"
        >
          <h3 className="mt-3 line-clamp-2 min-h-[58px] text-2xl font-black leading-tight tracking-[-0.035em] text-[var(--public-ink)] transition group-hover:text-[var(--public-accent-dark)]">
            {branch.name}
          </h3>
        </Link>

        {brandReferences.length > 0 && (
          <div className="mt-4 min-h-[28px] border-l-2 border-[var(--public-accent)] pl-3">
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[var(--public-muted)]">
              {brandReferences.join(" · ")}
            </p>
          </div>
        )}

        <div className="mt-6 border-y border-[var(--home-border)]">
          <div className="flex min-h-[76px] items-start gap-3 border-b border-[var(--home-border)] py-4">
            <MapPin
              size={18}
              className="mt-0.5 shrink-0 text-[var(--public-accent)]"
            />

            <p className="line-clamp-2 text-sm font-semibold leading-6 text-[var(--public-muted)]">
              {branch.address}
            </p>
          </div>

          {branch.phone && (
            <div className="flex min-h-[62px] items-center gap-3 py-4">
              <Phone
                size={17}
                className="shrink-0 text-[var(--public-accent)]"
              />

              <p className="text-sm font-black text-[var(--public-ink)]">
                {branch.phone}
              </p>
            </div>
          )}
        </div>

        {services.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {services.map((service) => (
              <span
                key={service}
                className="border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-3 py-2 text-[9px] font-black uppercase tracking-[0.11em] text-[var(--public-muted)]"
              >
                {service}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            href={`/sucursales/${branch.id}`}
            className="group/link inline-flex h-12 items-center justify-center gap-3 bg-[var(--public-header)] px-4 text-xs font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
          >
            Ver agencia

            <ArrowRight
              size={16}
              className="text-white transition-transform group-hover/link:translate-x-0.5"
            />
          </Link>

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 border border-emerald-600 bg-emerald-600 px-4 text-xs font-black !text-white transition hover:bg-emerald-700"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          ) : (
            <a
              href={mapExternalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-4 text-xs font-black text-[var(--public-ink)] transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:!text-white"
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
        page >= 1 &&
        page <= totalPages
    )
    .sort((a, b) => a - b);

  return (
    <nav
      aria-label="Paginación de sucursales"
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