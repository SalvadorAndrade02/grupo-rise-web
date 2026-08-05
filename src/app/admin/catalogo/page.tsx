import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  ArrowRight,
  Car,
  Eye,
  EyeOff,
  ImageIcon,
  Layers3,
  Plus,
  Search,
  Tags,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleMediaType,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import {
  AdminAlert,
  AdminHero,
  AdminInput,
  AdminPagination,
  AdminSelect,
  AdminSummaryCard,
} from "@/components/admin/ui";
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
    success?: string;
    error?: string;
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
    NAUTICA: "Náutica",
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

function parsePositiveInteger(
  value?: string
) {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) &&
    numberValue > 0
    ? numberValue
    : 0;
}

function parsePage(value?: string) {
  return (
    parsePositiveInteger(value) || 1
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

function revalidateCatalogPaths(
  modelId: number
) {
  revalidatePath("/admin");
  revalidatePath("/admin/catalogo");

  revalidatePath(
    `/admin/catalogo/${modelId}/editar`
  );

  revalidatePath(
    "/admin/inventario/nuevo"
  );

  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath("/");
}

async function toggleCatalogModelActive(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const modelId = Number(
    formData.get("modelId")
  );

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
        active: true,
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
      active: !model.active,
    },
  });

  revalidateCatalogPaths(modelId);
}

export default async function AdminCatalogPage({
  searchParams,
}: AdminCatalogPageProps) {
  await requireAdmin();

  const params = await searchParams;

  const search =
    params.q?.trim() ?? "";

  const selectedBrandId =
    parsePositiveInteger(
      params.marca
    );

  const brandFilter =
    selectedBrandId > 0
      ? String(selectedBrandId)
      : "TODAS";

  const typeFilter =
    parseCatalogType(params.tipo);

  const statusFilter =
    parseCatalogStatus(
      params.estado
    );

  const requestedPage =
    parsePage(params.pagina);

  const numericSearch =
    Number(search);

  const searchYear =
    search &&
      Number.isInteger(
        numericSearch
      ) &&
      numericSearch >= 1900 &&
      numericSearch <= 2100
      ? numericSearch
      : null;

  const searchConditions:
    Prisma.CatalogModelWhereInput[] =
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

  const where:
    Prisma.CatalogModelWhereInput = {
    ...(searchConditions.length > 0
      ? {
        OR: searchConditions,
      }
      : {}),

    ...(selectedBrandId > 0
      ? {
        brandId:
          selectedBrandId,
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

      select: {
        id: true,
        name: true,
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
      filteredModelCount /
      PAGE_SIZE
    )
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages
  );

  const paginationSkip =
    (currentPage - 1) *
    PAGE_SIZE;

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
        !model.mainImage &&
        model.images.length === 0
    ).length;

  const brandsWithCatalog =
    new Set(
      statsModels.map(
        (model) => model.brandId
      )
    ).size;

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

  const lastVisibleModel =
    Math.min(
      paginationSkip +
      catalogModels.length,
      filteredModelCount
    );

  const catalogQueryState:
    CatalogQueryState = {
    search,
    brand: brandFilter,
    type: typeFilter,
    status: statusFilter,
  };

  return (
    <div className="pb-10">
      <AdminHero
        eyebrow="Catálogo base"
        title="Modelos comerciales"
        description="Administra las plantillas de vehículos por marca, categoría, precio e información comercial."
        icon={Tags}
        actions={
          <>
            <Link
              href="/catalogo"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/25 bg-white/10 px-5 text-sm font-black !text-white transition hover:bg-white/15 hover:!text-white active:scale-[0.98] [&_*]:!text-current"
            >
              <Eye size={17} />
              <span>Ver catálogo público</span>
            </Link>

            <Link
              href="/admin/catalogo/nuevo"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white bg-white px-5 text-sm font-black !text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] hover:!text-[#192a3a] active:scale-[0.98] [&_*]:!text-current"
            >
              <Plus size={18} />
              <span>Nuevo modelo</span>

              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </>
        }
      />

      {params.success && (
        <AdminAlert
          variant="success"
          className="mt-5"
        >
          {params.success}
        </AdminAlert>
      )}

      {params.error && (
        <AdminAlert
          variant="error"
          className="mt-5"
        >
          {params.error}
        </AdminAlert>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminSummaryCard
          icon={Layers3}
          label="Total modelos"
          value={totalModels}
        />

        <AdminSummaryCard
          icon={Eye}
          label="Activos"
          value={activeModels}
          tone="emerald"
        />

        <AdminSummaryCard
          icon={EyeOff}
          label="Ocultos"
          value={hiddenModels}
          tone="red"
        />

        <AdminSummaryCard
          icon={Tags}
          label="Marcas"
          value={brandsWithCatalog}
          tone="blue"
        />

        <AdminSummaryCard
          icon={ImageIcon}
          label="Sin imagen"
          value={modelsWithoutImage}
          tone="amber"
        />
      </section>

      <section className="mt-6 rounded-[22px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#192a3a]" />

              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                Buscar y filtrar
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
              Modelos del catálogo
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Busca por modelo, marca,
              categoría, tipo o estado de
              publicación.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              {filteredModelCount} modelo
              {filteredModelCount === 1
                ? ""
                : "s"}
            </span>
          </div>
        </div>

        <form
          action="/admin/catalogo"
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(250px,1fr)_220px_200px_200px_auto]"
        >
          <AdminInput
            label="Buscar"
            name="q"
            defaultValue={search}
            placeholder="Modelo, marca, categoría o año"
          />

          <AdminSelect
            label="Marca"
            name="marca"
            defaultValue={brandFilter}
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
          </AdminSelect>

          <AdminSelect
            label="Tipo"
            name="tipo"
            defaultValue={typeFilter}
          >
            <option value="TODOS">
              Todos los tipos
            </option>

            {Object.values(
              VehicleCategory
            ).map((type) => (
              <option
                key={type}
                value={type}
              >
                {getCategoryLabel(type)}
              </option>
            ))}
          </AdminSelect>

          <AdminSelect
            label="Estado"
            name="estado"
            defaultValue={statusFilter}
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
          </AdminSelect>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#192a3a] bg-[#192a3a] px-6 text-sm font-black !text-white transition hover:border-[#29465c] hover:bg-[#29465c] hover:!text-white active:scale-[0.98] xl:self-end [&_*]:!text-current"
          >
            <Search size={17} />
            Buscar
          </button>
        </form>

        <div className="mt-5 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 lg:flex-row lg:items-center">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            <CatalogTypeLink
              href={buildCatalogHref({
                search,
                brand: brandFilter,
                type: "TODOS",
                status:
                  statusFilter,
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
                  status:
                    statusFilter,
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

          {hasFilters && (
            <Link
              href="/admin/catalogo"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#192a3a]/15 bg-[#eef0ee] px-4 text-xs font-black !text-[#192a3a] transition hover:border-[#192a3a]/30 hover:bg-[#e1e5e3] hover:!text-[#192a3a] active:scale-[0.98]"
            >
              Limpiar filtros
            </Link>
          )}
        </div>
      </section>

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
                  model.images[0]
                    ?.url ||
                  "";

                const hasPrice =
                  model.priceFrom !==
                  null &&
                  Number(
                    model.priceFrom
                  ) > 0;

                const hasDescription =
                  Boolean(
                    model.description?.trim()
                  );

                const hasIssues =
                  !image ||
                  !hasDescription ||
                  !hasPrice;

                return (
                  <article
                    key={model.id}
                    className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:border-[#192a3a]/25 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                  >
                    <div className="grid xl:grid-cols-[230px_minmax(0,1fr)_290px]">
                      <div className="relative h-[230px] overflow-hidden bg-slate-100 sm:h-[300px] xl:h-full xl:min-h-[330px]">
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
                          className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] backdrop-blur-sm ${model.active
                            ? "border-emerald-200 bg-emerald-50/95 text-emerald-700"
                            : "border-slate-200 bg-white/95 text-slate-600"
                            }`}
                        >
                          {model.active ? (
                            <Eye
                              size={13}
                            />
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
                            className={`w-fit rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${model.active
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

                        {hasDescription ? (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                            {
                              model.description
                            }
                          </p>
                        ) : (
                          <p className="mt-3 text-sm italic leading-6 text-slate-400">
                            Este modelo no
                            tiene una
                            descripción
                            comercial.
                          </p>
                        )}

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <CatalogDetail
                            label="Precio desde"
                            value={
                              hasPrice
                                ? formatCurrency(
                                  Number(
                                    model.priceFrom
                                  )
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

                              Información
                              pendiente
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {!image && (
                                <IssueBadge label="Sin imagen" />
                              )}

                              {!hasDescription && (
                                <IssueBadge label="Sin descripción" />
                              )}

                              {!hasPrice && (
                                <IssueBadge label="Sin precio base" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <CatalogModelActions
                        modelId={model.id}
                        active={
                          model.active
                        }
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
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#192a3a]/15 bg-[#eef0ee] px-4 text-xs font-black !text-[#192a3a] transition hover:border-[#192a3a]/30 hover:bg-[#e1e5e3] hover:!text-[#192a3a] active:scale-[0.98]"
                >
                  Limpiar filtros
                </Link>
              )}

              <Link
                href="/admin/catalogo/nuevo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#192a3a] bg-[#192a3a] px-5 text-sm font-black !text-white transition hover:border-[#29465c] hover:bg-[#29465c] hover:!text-white active:scale-[0.98] [&_*]:!text-current"
              >
                <Plus size={17} />
                <span>Registrar modelo</span>
              </Link>
            </div>
          </div>
        )}

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredModelCount}
          firstItem={firstVisibleModel}
          lastItem={lastVisibleModel}
          itemLabel="modelo"
          itemLabelPlural="modelos"
          hrefForPage={(page) =>
            buildCatalogHref({
              ...catalogQueryState,
              page,
            })
          }
        />
      </section>

      <AdminAlert
        variant="info"
        className="mt-6"
      >
        Actualmente existen{" "}
        <strong>
          {hiddenModels} modelos
          ocultos
        </strong>
        . Los modelos activos pueden
        seleccionarse como base al
        registrar nuevas unidades de
        inventario.
      </AdminAlert>
    </div>
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
      className={[
        "inline-flex h-10 shrink-0 items-center justify-center",
        "rounded-md border px-4",
        "text-[10px] font-black uppercase tracking-[0.1em]",
        "transition duration-200 active:scale-[0.98]",
        active
          ? [
            "border-[#192a3a]",
            "bg-[#192a3a]",
            "!text-white",
            "hover:!text-white",
            "shadow-[0_5px_14px_rgba(25,42,58,0.16)]",
            "[&_*]:!text-current",
          ].join(" ")
          : [
            "border-[#192a3a]/10",
            "bg-[#f7f8f7]",
            "!text-slate-600",
            "hover:border-[#192a3a]/25",
            "hover:bg-[#eef0ee]",
            "hover:!text-[#192a3a]",
          ].join(" "),
      ].join(" ")}
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
      className={`rounded-[16px] border p-4 ${highlighted
        ? "border-[#192a3a]/10 bg-[#e7edf1]"
        : "border-slate-100 bg-[#f8fafb]"
        }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-xs font-black ${highlighted
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
    <aside className="border-t border-[#192a3a]/10 bg-[#f7f8f7] p-5 xl:border-l xl:border-t-0">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        Acciones
      </p>

      <div className="mt-4 grid gap-3">
        <Link
          href={`/admin/catalogo/${modelId}/editar`}
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#192a3a] bg-[#192a3a] px-4 text-xs font-black !text-white transition hover:border-[#29465c] hover:bg-[#29465c] hover:!text-white active:scale-[0.98] [&_*]:!text-current"
        >
          <span>Editar modelo</span>

          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>

        <Link
          href="/admin/inventario/nuevo"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#192a3a]/15 bg-white px-4 text-xs font-black !text-[#192a3a] transition hover:border-[#192a3a]/30 hover:bg-[#eef0ee] hover:!text-[#192a3a] active:scale-[0.98] [&_*]:!text-current"
        >
          <Car size={16} />
          <span>Crear unidad</span>
        </Link>

        <form action={toggleCatalogModelActive}>
          <input
            type="hidden"
            name="modelId"
            value={modelId}
          />

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#192a3a]/15 bg-white px-4 text-xs font-black !text-slate-600 transition hover:border-[#192a3a]/30 hover:bg-[#eef0ee] hover:!text-[#192a3a] active:scale-[0.98] [&_*]:!text-current"
          >
            {active ? (
              <>
                <EyeOff size={16} />
                <span>Ocultar modelo</span>
              </>
            ) : (
              <>
                <Eye size={16} />
                <span>Mostrar modelo</span>
              </>
            )}
          </button>
        </form>
      </div>
    </aside>
  );
}