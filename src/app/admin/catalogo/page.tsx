import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Car,
  Eye,
  EyeOff,
  ImageIcon,
  Layers3,
  Plus,
  Search,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleMediaType,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

type AdminCatalogPageProps = {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    tipo?: string;
    estado?: string;
    pagina?: string;
    error?: string;
    success?: string;
  }>;
};

type CatalogTypeFilter =
  | VehicleCategory
  | "TODOS";

type CatalogStatusFilter =
  | "TODOS"
  | "ACTIVOS"
  | "OCULTOS";

type CatalogQueryState = {
  search: string;
  brand: string;
  type: CatalogTypeFilter;
  status: CatalogStatusFilter;
};

type CatalogStatTone =
  | "navy"
  | "blue"
  | "emerald"
  | "amber"
  | "red";

const PAGE_SIZE = 6;

function getCategoryLabel(
  category: VehicleCategory
) {
  const labels: Record<
    VehicleCategory,
    string
  > = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todoterreno",
  };

  return labels[category];
}

function parseCatalogType(
  value?: string
): CatalogTypeFilter {
  if (
    value &&
    Object.values(
      VehicleCategory
    ).includes(
      value as VehicleCategory
    )
  ) {
    return value as VehicleCategory;
  }

  return "TODOS";
}

function parseCatalogStatus(
  value?: string
): CatalogStatusFilter {
  if (
    value === "ACTIVOS" ||
    value === "OCULTOS"
  ) {
    return value;
  }

  return "TODOS";
}

function parsePage(value?: string) {
  const page = Number(value);

  return Number.isInteger(page) &&
    page > 0
    ? page
    : 1;
}

function parseBrandFilter(
  value?: string
) {
  if (!value || value === "TODAS") {
    return "TODAS";
  }

  const brandId = Number(value);

  return Number.isInteger(brandId) &&
    brandId > 0
    ? String(brandId)
    : "TODAS";
}

function getPaginationPages(
  currentPage: number,
  totalPages: number
) {
  const visiblePages = 5;

  let startPage = Math.max(
    1,
    currentPage - 2
  );

  const endPage = Math.min(
    totalPages,
    startPage + visiblePages - 1
  );

  if (
    endPage - startPage + 1 <
    visiblePages
  ) {
    startPage = Math.max(
      1,
      endPage - visiblePages + 1
    );
  }

  return Array.from(
    {
      length:
        endPage - startPage + 1,
    },
    (_, index) => startPage + index
  );
}

function buildCatalogHref({
  search = "",
  brand = "TODAS",
  type = "TODOS",
  status = "TODOS",
  page = 1,
}: {
  search?: string;
  brand?: string;
  type?: string;
  status?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("q", search.trim());
  }

  if (brand !== "TODAS") {
    params.set("marca", brand);
  }

  if (type !== "TODOS") {
    params.set("tipo", type);
  }

  if (status !== "TODOS") {
    params.set("estado", status);
  }

  if (page > 1) {
    params.set(
      "pagina",
      String(page)
    );
  }

  const query = params.toString();

  return query
    ? `/admin/catalogo?${query}`
    : "/admin/catalogo";
}

function revalidateCatalogPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/catalogo");
  revalidatePath(
    "/admin/inventario/nuevo"
  );
  revalidatePath("/catalogo");
}

async function toggleCatalogModelActive(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const modelId = Number(
    formData.get("modelId")
  );

  const currentActive =
    String(
      formData.get("active")
    ) === "true";

  if (
    !Number.isInteger(modelId) ||
    modelId <= 0
  ) {
    return;
  }

  const model =
    await prisma.catalogModel.findUnique({
      where: {
        id: modelId,
      },

      select: {
        id: true,
      },
    });

  if (!model) {
    return;
  }

  await prisma.catalogModel.update({
    where: {
      id: modelId,
    },

    data: {
      active: !currentActive,
    },
  });

  revalidateCatalogPaths();
}

export default async function AdminCatalogPage({
  searchParams,
}: AdminCatalogPageProps) {
  await requireAdmin();

  const params = await searchParams;

  const search =
    params.q?.trim() ?? "";

  const brandFilter =
    parseBrandFilter(params.marca);

  const typeFilter =
    parseCatalogType(params.tipo);

  const statusFilter =
    parseCatalogStatus(params.estado);

  const requestedPage =
    parsePage(params.pagina);

  const selectedBrandId =
    brandFilter !== "TODAS"
      ? Number(brandFilter)
      : 0;

  const numericSearch =
    Number(search);

  const searchYear =
    search &&
    Number.isInteger(numericSearch) &&
    numericSearch >= 1900 &&
    numericSearch <= 2100
      ? numericSearch
      : null;

  const searchConditions: Prisma.CatalogModelWhereInput[] =
    [];

  if (search) {
    searchConditions.push(
      {
        name: {
          contains: search,
        },
      },
      {
        subtitle: {
          contains: search,
        },
      },
      {
        description: {
          contains: search,
        },
      },
      {
        specs: {
          contains: search,
        },
      },
      {
        features: {
          contains: search,
        },
      },
      {
        brand: {
          is: {
            name: {
              contains: search,
            },
          },
        },
      },
      {
        category: {
          is: {
            name: {
              contains: search,
            },
          },
        },
      }
    );

    if (searchYear !== null) {
      searchConditions.push({
        year: searchYear,
      });
    }
  }

  const where: Prisma.CatalogModelWhereInput =
    {
      ...(searchConditions.length > 0
        ? {
            OR: searchConditions,
          }
        : {}),

      ...(selectedBrandId > 0
        ? {
            brandId: selectedBrandId,
          }
        : {}),

      ...(typeFilter !== "TODOS"
        ? {
            categoryType:
              typeFilter,
          }
        : {}),

      ...(statusFilter === "ACTIVOS"
        ? {
            active: true,
          }
        : statusFilter === "OCULTOS"
          ? {
              active: false,
            }
          : {}),
    };

  const [
    brands,
    filteredModelCount,
    statsModels,
  ] = await Promise.all([
    prisma.brand.findMany({
      where: {
        active: true,
      },

      orderBy: {
        name: "asc",
      },
    }),

    prisma.catalogModel.count({
      where,
    }),

    prisma.catalogModel.findMany({
      select: {
        brandId: true,
        active: true,
        mainImage: true,

        images: {
          where: {
            type:
              VehicleMediaType.IMAGE,
          },

          select: {
            id: true,
          },

          take: 1,
        },
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredModelCount / PAGE_SIZE
    )
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages
  );

  const paginationSkip =
    (currentPage - 1) * PAGE_SIZE;

  const catalogModels =
    await prisma.catalogModel.findMany({
      where,
      skip: paginationSkip,
      take: PAGE_SIZE,

      include: {
        brand: true,
        category: true,

        images: {
          where: {
            type:
              VehicleMediaType.IMAGE,
          },

          orderBy: {
            order: "asc",
          },

          take: 1,
        },
      },

      orderBy: [
        {
          brand: {
            name: "asc",
          },
        },
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  const totalModels =
    statsModels.length;

  const activeModels =
    statsModels.filter(
      (model) => model.active
    ).length;

  const hiddenModels =
    totalModels - activeModels;

  const modelsWithoutImage =
    statsModels.filter(
      (model) =>
        !model.mainImage?.trim() &&
        model.images.length === 0
    ).length;

  const brandsWithCatalog =
    new Set(
      statsModels.map(
        (model) => model.brandId
      )
    ).size;

  const stats: Array<{
    label: string;
    value: number;
    description: string;
    icon: LucideIcon;
    tone: CatalogStatTone;
  }> = [
    {
      label: "Modelos",
      value: totalModels,
      description:
        "Plantillas comerciales registradas.",
      icon: Layers3,
      tone: "navy",
    },
    {
      label: "Activos",
      value: activeModels,
      description:
        "Disponibles para crear unidades.",
      icon: BadgeCheck,
      tone: "emerald",
    },
    {
      label: "Ocultos",
      value: hiddenModels,
      description:
        "Modelos fuera de publicación.",
      icon: EyeOff,
      tone: "amber",
    },
    {
      label: "Marcas",
      value: brandsWithCatalog,
      description:
        "Marcas con modelos registrados.",
      icon: Tags,
      tone: "blue",
    },
    {
      label: "Sin imagen",
      value: modelsWithoutImage,
      description:
        "Modelos que necesitan portada.",
      icon: ImageIcon,
      tone: "red",
    },
  ];

  const hasAdvancedFilters =
    brandFilter !== "TODAS" ||
    typeFilter !== "TODOS" ||
    statusFilter !== "TODOS";

  const hasFilters =
    Boolean(search) ||
    hasAdvancedFilters;

  const activeFilterCount = [
    Boolean(search),
    brandFilter !== "TODAS",
    typeFilter !== "TODOS",
    statusFilter !== "TODOS",
  ].filter(Boolean).length;

  const firstVisibleModel =
    filteredModelCount === 0
      ? 0
      : paginationSkip + 1;

  const lastVisibleModel = Math.min(
    paginationSkip +
      catalogModels.length,
    filteredModelCount
  );

  const catalogQueryState: CatalogQueryState =
    {
      search,
      brand: brandFilter,
      type: typeFilter,
      status: statusFilter,
    };

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
              <Tags size={15} />
              Catálogo base
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
              Modelos comerciales
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              Administra las plantillas de
              vehículos por marca, categoría,
              precio e información comercial.
            </p>
          </div>

          <Link
            href="/admin/catalogo/nuevo"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
          >
            <Plus size={18} />
            Nuevo modelo

            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </section>

      {/* Mensajes */}
      {params.error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700"
        >
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>{params.error}</span>
        </div>
      )}

      {params.success && (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-700"
        >
          <BadgeCheck
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>{params.success}</span>
        </div>
      )}

      {/* Estadísticas */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <CatalogStatCard
            key={stat.label}
            {...stat}
          />
        ))}
      </section>

      {/* Filtros */}
      <section className="mt-6 rounded-[22px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#192a3a]" />

              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                Buscar y filtrar
              </p>
            </div>

            <h2 className="mt-3 flex items-center gap-2 text-2xl font-black tracking-[-0.035em]">
              <SlidersHorizontal size={20} />
              Modelos del catálogo
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Busca por modelo, marca,
              categoría, contenido o año.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeFilterCount > 0 && (
              <span className="rounded-full border border-[#192a3a]/10 bg-[#e7edf1] px-4 py-2 text-xs font-black text-[#192a3a]">
                {activeFilterCount} filtro
                {activeFilterCount === 1
                  ? ""
                  : "s"}{" "}
                activo
                {activeFilterCount === 1
                  ? ""
                  : "s"}
              </span>
            )}

            <span className="rounded-full border border-slate-200 bg-[#f8fafb] px-4 py-2 text-xs font-black text-slate-600">
              {filteredModelCount} resultado
              {filteredModelCount === 1
                ? ""
                : "s"}
            </span>
          </div>
        </div>

        <form
          action="/admin/catalogo"
          className="mt-6"
        >
          {/* Búsqueda principal */}
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                Buscar modelo
              </span>

              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  name="q"
                  defaultValue={search}
                  placeholder="Modelo, marca, categoría o año"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
                />
              </div>
            </label>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-6 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98] lg:self-end"
            >
              <Search size={17} />
              Buscar
            </button>

            {hasFilters && (
              <Link
                href="/admin/catalogo"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98] lg:self-end"
              >
                Limpiar
              </Link>
            )}
          </div>

          {/* Filtros secundarios */}
          <details
            open={hasAdvancedFilters}
            className="group mt-4 overflow-hidden rounded-[16px] border border-slate-200 bg-[#f8fafb]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-black text-[#192a3a]">
                <SlidersHorizontal
                  size={16}
                />
                Más filtros
              </span>

              <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#192a3a] transition group-open:rotate-90">
                <ArrowRight size={14} />
              </span>
            </summary>

            <div className="border-t border-slate-200 p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FilterSelect
                  label="Marca"
                  name="marca"
                  defaultValue={
                    brandFilter
                  }
                >
                  <option value="TODAS">
                    Todas las marcas
                  </option>

                  {brands.map((brand) => (
                    <option
                      key={brand.id}
                      value={brand.id}
                    >
                      {brand.name}
                    </option>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Tipo"
                  name="tipo"
                  defaultValue={
                    typeFilter
                  }
                >
                  <option value="TODOS">
                    Todos los tipos
                  </option>

                  <option
                    value={
                      VehicleCategory.AUTO
                    }
                  >
                    Auto
                  </option>

                  <option
                    value={
                      VehicleCategory.MOTO
                    }
                  >
                    Moto
                  </option>

                  <option
                    value={
                      VehicleCategory.TODOTERRENO
                    }
                  >
                    Todoterreno
                  </option>
                </FilterSelect>

                <FilterSelect
                  label="Estado"
                  name="estado"
                  defaultValue={
                    statusFilter
                  }
                >
                  <option value="TODOS">
                    Todos
                  </option>

                  <option value="ACTIVOS">
                    Activos
                  </option>

                  <option value="OCULTOS">
                    Ocultos
                  </option>
                </FilterSelect>
              </div>

              <div className="mt-4 flex flex-col justify-end gap-3 sm:flex-row">
                {hasAdvancedFilters && (
                  <Link
                    href={
                      search
                        ? `/admin/catalogo?q=${encodeURIComponent(
                            search
                          )}`
                        : "/admin/catalogo"
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-600 transition hover:border-[#192a3a] hover:text-[#192a3a]"
                  >
                    Limpiar secundarios
                  </Link>
                )}

                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-xs font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </details>
        </form>

        {/* Filtros rápidos */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          <CatalogTypeLink
            href={buildCatalogHref({
              search,
              brand: brandFilter,
              type: "TODOS",
              status: statusFilter,
            })}
            active={
              typeFilter === "TODOS"
            }
            label="Todos"
          />

          {Object.values(
            VehicleCategory
          ).map((type) => (
            <CatalogTypeLink
              key={type}
              href={buildCatalogHref({
                search,
                brand: brandFilter,
                type,
                status: statusFilter,
              })}
              active={
                typeFilter === type
              }
              label={getCategoryLabel(
                type
              )}
            />
          ))}
        </div>
      </section>

      {/* Resultados */}
      <section className="mt-6">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#192a3a]" />

              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                Resultados
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
              Modelos registrados
            </h2>

            {filteredModelCount > 0 && (
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Mostrando{" "}
                {firstVisibleModel}–
                {lastVisibleModel} de{" "}
                {filteredModelCount}
              </p>
            )}
          </div>

          <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600">
            {filteredModelCount} modelo
            {filteredModelCount === 1
              ? ""
              : "s"}
          </span>
        </div>

        {catalogModels.length > 0 ? (
          <div className="grid gap-5">
            {catalogModels.map(
              (model) => {
                const image =
                  model.mainImage ||
                  model.images[0]?.url ||
                  "";

                const hasPrice =
                  model.priceFrom !== null &&
                  Number(
                    model.priceFrom
                  ) > 0;

                const hasIssues =
                  !image ||
                  !model.description?.trim() ||
                  !hasPrice;

                return (
                  <article
                    key={model.id}
                    className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:border-[#192a3a]/25 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                  >
                    <div className="grid xl:grid-cols-[210px_minmax(0,1fr)_290px]">
                      {/* Imagen */}
                      <div className="relative h-[220px] overflow-hidden bg-slate-100 sm:h-[280px] xl:h-full xl:min-h-[320px]">
                        {image ? (
                          <img
                            src={image}
                            alt={`${model.brand.name} ${model.name}`}
                            className="h-full w-full object-cover transition duration-700 hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-slate-400">
                            <div className="text-center">
                              <ImageIcon
                                size={42}
                                className="mx-auto"
                              />

                              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em]">
                                Sin imagen
                              </p>
                            </div>
                          </div>
                        )}

                        <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#192a3a] shadow-sm backdrop-blur-sm">
                          Modelo #{model.id}
                        </span>

                        <span
                          className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] backdrop-blur-sm ${
                            model.active
                              ? "border-emerald-200 bg-emerald-50/95 text-emerald-700"
                              : "border-slate-200 bg-white/95 text-slate-600"
                          }`}
                        >
                          {model.active ? (
                            <Eye size={13} />
                          ) : (
                            <EyeOff
                              size={13}
                            />
                          )}

                          {model.active
                            ? "Activo"
                            : "Oculto"}
                        </span>
                      </div>

                      {/* Información */}
                      <div className="min-w-0 p-5 md:p-6">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#192a3a]">
                              {
                                model.brand
                                  .name
                              }
                            </p>

                            <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.035em] md:text-3xl">
                              {model.name}
                            </h3>

                            <p className="mt-2 text-sm font-semibold text-slate-500">
                              {model.category
                                ?.name ??
                                "Sin categoría"}{" "}
                              ·{" "}
                              {getCategoryLabel(
                                model.categoryType
                              )}
                              {model.year
                                ? ` · ${model.year}`
                                : ""}
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${
                              model.active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            {model.active
                              ? "Publicado"
                              : "No publicado"}
                          </span>
                        </div>

                        {model.subtitle && (
                          <p className="mt-4 text-sm font-black leading-6 text-slate-700">
                            {
                              model.subtitle
                            }
                          </p>
                        )}

                        {model.description ? (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                            {
                              model.description
                            }
                          </p>
                        ) : (
                          <p className="mt-3 text-sm italic leading-6 text-slate-400">
                            Este modelo no tiene
                            una descripción
                            comercial.
                          </p>
                        )}

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <CatalogDetail
                            label="Precio desde"
                            value={
                              hasPrice
                                ? formatCurrency(
                                    model.priceFrom ??
                                      0
                                  )
                                : "Sin precio"
                            }
                            highlighted
                          />

                          <CatalogDetail
                            label="Tipo"
                            value={getCategoryLabel(
                              model.categoryType
                            )}
                          />

                          <CatalogDetail
                            label="Orden"
                            value={String(
                              model.sortOrder
                            )}
                          />
                        </div>

                        {hasIssues && (
                          <div className="mt-5 border-t border-slate-100 pt-5">
                            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                              <AlertTriangle
                                size={14}
                                className="text-amber-600"
                              />
                              Información pendiente
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {!image && (
                                <IssueBadge label="Sin imagen" />
                              )}

                              {!model.description?.trim() && (
                                <IssueBadge label="Sin descripción" />
                              )}

                              {!hasPrice && (
                                <IssueBadge label="Sin precio base" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <CatalogModelActions
                        modelId={model.id}
                        active={model.active}
                      />
                    </div>
                  </article>
                );
              }
            )}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <Tags
              size={50}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-4 text-2xl font-black">
              No hay modelos con ese
              criterio
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Modifica los filtros o
              registra un nuevo modelo
              comercial.
            </p>

            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              {hasFilters && (
                <Link
                  href="/admin/catalogo"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
                >
                  Limpiar filtros
                </Link>
              )}

              <Link
                href="/admin/catalogo/nuevo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
              >
                <Plus size={17} />
                Registrar modelo
              </Link>
            </div>
          </div>
        )}

        <CatalogPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={
            filteredModelCount
          }
          firstItem={firstVisibleModel}
          lastItem={lastVisibleModel}
          filters={catalogQueryState}
        />
      </section>

      {/* Resumen */}
      <section className="mt-6 rounded-[18px] border border-[#192a3a]/10 bg-[#e7edf1] px-5 py-4">
        <p className="text-sm font-black text-[#192a3a]">
          Resumen del catálogo
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Actualmente existen{" "}
          {hiddenModels} modelos ocultos.
          Los {activeModels} modelos activos
          pueden utilizarse como base para
          registrar nuevas unidades.
        </p>
      </section>
    </div>
  );
}

function CatalogStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone: CatalogStatTone;
}) {
  const tones: Record<
    CatalogStatTone,
    string
  > = {
    navy:
      "border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]",

    blue:
      "border-blue-100 bg-blue-50 text-blue-700",

    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-700",

    amber:
      "border-amber-100 bg-amber-50 text-amber-700",

    red:
      "border-red-100 bg-red-50 text-red-700",
  };

  return (
    <article className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
      <span
        className={`grid h-11 w-11 place-items-center rounded-xl border ${tones[tone]}`}
      >
        <Icon size={21} />
      </span>

      <p className="mt-5 text-4xl font-black tracking-[-0.05em] text-[#192a3a]">
        {value}
      </p>

      <h2 className="mt-2 text-sm font-black">
        {label}
      </h2>

      <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}

function FilterSelect({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <select
        name={name}
        defaultValue={defaultValue}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#192a3a] focus:ring-2 focus:ring-[#192a3a]/10"
      >
        {children}
      </select>
    </label>
  );
}

function CatalogTypeLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition ${
        active
          ? "border-[#192a3a] bg-[#192a3a] text-white"
          : "border-slate-200 bg-white text-slate-500 hover:border-[#192a3a] hover:text-[#192a3a]"
      }`}
    >
      {label}
    </Link>
  );
}

function CatalogDetail({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-[16px] border p-4 ${
        highlighted
          ? "border-[#192a3a]/10 bg-[#e7edf1]"
          : "border-slate-100 bg-[#f8fafb]"
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-xs font-black ${
          highlighted
            ? "text-[#192a3a]"
            : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function IssueBadge({
  label,
}: {
  label: string;
}) {
  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-amber-700">
      {label}
    </span>
  );
}

function CatalogModelActions({
  modelId,
  active,
}: {
  modelId: number;
  active: boolean;
}) {
  return (
    <aside className="border-t border-slate-100 bg-[#f8fafb] p-5 xl:border-l xl:border-t-0">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        Acciones
      </p>

      <div className="mt-4 grid gap-3">
        <Link
          href={`/admin/catalogo/${modelId}/editar`}
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-4 text-xs font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
        >
          Editar modelo

          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>

        <Link
          href="/admin/inventario/nuevo"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
        >
          <Car size={16} />
          Crear unidad
        </Link>

        <form
          action={toggleCatalogModelActive}
        >
          <input
            type="hidden"
            name="modelId"
            value={modelId}
          />

          <input
            type="hidden"
            name="active"
            value={String(active)}
          />

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a] active:scale-[0.98]"
          >
            {active ? (
              <>
                <EyeOff size={16} />
                Ocultar modelo
              </>
            ) : (
              <>
                <Eye size={16} />
                Mostrar modelo
              </>
            )}
          </button>
        </form>
      </div>
    </aside>
  );
}

function CatalogPagination({
  currentPage,
  totalPages,
  totalItems,
  firstItem,
  lastItem,
  filters,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  firstItem: number;
  lastItem: number;
  filters: CatalogQueryState;
}) {
  if (totalItems === 0) {
    return null;
  }

  const pages = getPaginationPages(
    currentPage,
    totalPages
  );

  return (
    <nav
      aria-label="Paginación del catálogo"
      className="mt-6 flex flex-col gap-4 rounded-[18px] border border-black/[0.08] bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs font-semibold text-slate-500">
        Mostrando{" "}
        <strong className="text-[#192a3a]">
          {firstItem}–{lastItem}
        </strong>{" "}
        de{" "}
        <strong className="text-[#192a3a]">
          {totalItems}
        </strong>{" "}
        modelos
      </p>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        {currentPage > 1 ? (
          <Link
            href={buildCatalogHref({
              ...filters,
              page: currentPage - 1,
            })}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1]"
          >
            <ArrowLeft size={14} />
            Anterior
          </Link>
        ) : (
          <span className="inline-flex h-10 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 text-xs font-black text-slate-300">
            <ArrowLeft size={14} />
            Anterior
          </span>
        )}

        {pages.map((page) => (
          <Link
            key={page}
            href={buildCatalogHref({
              ...filters,
              page,
            })}
            aria-current={
              page === currentPage
                ? "page"
                : undefined
            }
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-xs font-black transition ${
              page === currentPage
                ? "border-[#192a3a] bg-[#192a3a] text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a]"
            }`}
          >
            {page}
          </Link>
        ))}

        {currentPage < totalPages ? (
          <Link
            href={buildCatalogHref({
              ...filters,
              page: currentPage + 1,
            })}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1]"
          >
            Siguiente
            <ArrowRight size={14} />
          </Link>
        ) : (
          <span className="inline-flex h-10 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 text-xs font-black text-slate-300">
            Siguiente
            <ArrowRight size={14} />
          </span>
        )}
      </div>
    </nav>
  );
}