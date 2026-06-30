import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowRight,
  BadgeCheck,
  Car,
  Eye,
  EyeOff,
  ImageIcon,
  Layers3,
  Plus,
  Search,
  Sparkles,
  Tags,
} from "lucide-react";
import { VehicleCategory, VehicleMediaType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

type AdminCatalogPageProps = {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    tipo?: string;
    estado?: string;
  }>;
};

function getCategoryLabel(category: VehicleCategory) {
  const labels: Record<VehicleCategory, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category];
}

function buildCatalogHref({
  search = "",
  brand = "TODAS",
  type = "TODOS",
  status = "TODOS",
}: {
  search?: string;
  brand?: string;
  type?: string;
  status?: string;
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

  const query = params.toString();

  return query ? `/admin/catalogo?${query}` : "/admin/catalogo";
}

async function toggleCatalogModelActive(formData: FormData) {
  "use server";

  const modelId = Number(formData.get("modelId"));
  const active = String(formData.get("active")) === "true";

  if (!modelId) {
    return;
  }

  await prisma.catalogModel.update({
    where: {
      id: modelId,
    },
    data: {
      active: !active,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
}

export default async function AdminCatalogPage({
  searchParams,
}: AdminCatalogPageProps) {
  const params = await searchParams;

  const search = params.q?.trim() ?? "";
  const normalizedSearch = search.toLowerCase();
  const brandFilter = params.marca ?? "TODAS";
  const typeFilter = params.tipo ?? "TODOS";
  const statusFilter = params.estado ?? "TODOS";

  const [brands, catalogModels] = await Promise.all([
    prisma.brand.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.catalogModel.findMany({
      include: {
        brand: true,
        category: true,
        images: {
          where: {
            type: VehicleMediaType.IMAGE,
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
    }),
  ]);

  const filteredModels = catalogModels.filter((model) => {
    const matchesSearch = normalizedSearch
      ? [
        model.name,
        model.subtitle,
        model.description,
        model.brand.name,
        model.category?.name,
        model.year,
        getCategoryLabel(model.categoryType),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
      : true;

    const matchesBrand =
      brandFilter !== "TODAS" ? String(model.brandId) === brandFilter : true;

    const matchesType =
      typeFilter !== "TODOS" ? model.categoryType === typeFilter : true;

    const matchesStatus =
      statusFilter === "ACTIVOS"
        ? model.active
        : statusFilter === "OCULTOS"
          ? !model.active
          : true;

    return matchesSearch && matchesBrand && matchesType && matchesStatus;
  });

  const activeModels = catalogModels.filter((model) => model.active).length;
  const canAmModels = catalogModels.filter(
    (model) => model.brand.name.toLowerCase() === "can-am"
  ).length;
  const modelsWithoutImage = catalogModels.filter(
    (model) => !model.mainImage && model.images.length === 0
  ).length;
  const modelsWithoutDescription = catalogModels.filter(
    (model) => !model.description?.trim()
  ).length;

  const brandsWithCatalog = new Set(
    catalogModels.map((model) => model.brandId)
  ).size;

  const hasFilters =
    search ||
    brandFilter !== "TODAS" ||
    typeFilter !== "TODOS" ||
    statusFilter !== "TODOS";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
            Catálogo base
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Modelos comerciales
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Administra los modelos base por marca. Estos modelos sirven como
            plantilla al registrar unidades reales en inventario.
          </p>
        </div>

        <Link
          href="/admin/catalogo/nuevo"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
        >
          <Plus size={18} />
          Nuevo modelo
        </Link>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Layers3 size={24} className="text-[var(--rise-blue)]" />
          <p className="mt-4 text-4xl font-black">{catalogModels.length}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">
            Modelos registrados
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <BadgeCheck size={24} className="text-emerald-600" />
          <p className="mt-4 text-4xl font-black">{activeModels}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">
            Activos
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Sparkles size={24} className="text-amber-600" />
          <p className="mt-4 text-4xl font-black">{canAmModels}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">
            Can-Am
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <ImageIcon size={24} className="text-slate-500" />
          <p className="mt-4 text-4xl font-black">{modelsWithoutImage}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">
            Sin imagen
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Car size={24} className="text-[var(--rise-blue)]" />
          <p className="mt-4 text-4xl font-black">{brandsWithCatalog}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">
            Marcas con catálogo
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Filtros
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Buscar modelos base
            </h2>
          </div>

          {hasFilters && (
            <Link
              href="/admin/catalogo"
              className="rounded-xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
            >
              Limpiar filtros
            </Link>
          )}
        </div>

        <form
          action="/admin/catalogo"
          className="mt-5 grid gap-3 xl:grid-cols-[1fr_240px_220px_220px_auto]"
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              name="q"
              defaultValue={search}
              placeholder="Buscar por modelo, marca, categoría o descripción..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
            />
          </div>

          <select
            name="marca"
            defaultValue={brandFilter}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
          >
            <option value="TODAS">Todas las marcas</option>

            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          <select
            name="tipo"
            defaultValue={typeFilter}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="AUTO">Auto</option>
            <option value="MOTO">Moto</option>
            <option value="TODOTERRENO">Todo terreno</option>
          </select>

          <select
            name="estado"
            defaultValue={statusFilter}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
          >
            <option value="TODOS">Todos</option>
            <option value="ACTIVOS">Activos</option>
            <option value="OCULTOS">Ocultos</option>
          </select>

          <button
            type="submit"
            className="h-12 rounded-2xl bg-[var(--rise-navy)] px-6 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
          >
            Buscar
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={buildCatalogHref({
              search,
              brand: brandFilter,
              type: "TODOS",
              status: statusFilter,
            })}
            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition ${typeFilter === "TODOS"
                ? "bg-[var(--rise-navy)] text-white"
                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
          >
            Todos
          </Link>

          {Object.values(VehicleCategory).map((type) => (
            <Link
              key={type}
              href={buildCatalogHref({
                search,
                brand: brandFilter,
                type,
                status: statusFilter,
              })}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition ${typeFilter === type
                  ? "bg-[var(--rise-navy)] text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
            >
              {getCategoryLabel(type)}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Resultados
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {filteredModels.length} modelo(s)
            </h2>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredModels.length > 0 ? (
            filteredModels.map((model) => {
              const image = model.images[0]?.url || model.mainImage || "";
              const hasIssues =
                !image || !model.description?.trim() || !model.priceFrom;

              return (
                <article
                  key={model.id}
                  className="overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-sm transition hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="grid xl:grid-cols-[180px_minmax(0,1fr)_280px]">
                    <div className="relative h-48 bg-slate-100 xl:h-full">
                      {image ? (
                        <img
                          src={image}
                          alt={`${model.brand.name} ${model.name}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">
                          <div className="text-center">
                            <ImageIcon className="mx-auto" size={42} />
                            <p className="mt-2 text-xs font-black uppercase tracking-wider">
                              Sin imagen
                            </p>
                          </div>
                        </div>
                      )}

                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[var(--rise-blue)] shadow-sm">
                        Modelo #{model.id}
                      </span>
                    </div>

                    <div className="p-5 md:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                            {model.brand.name}
                          </p>

                          <h3 className="mt-2 text-2xl font-black text-[var(--rise-navy)] md:text-3xl">
                            {model.name}
                          </h3>

                          <p className="mt-2 text-sm font-bold text-slate-500">
                            {model.category?.name ?? "Sin categoría"} ·{" "}
                            {getCategoryLabel(model.categoryType)}
                            {model.year ? ` · ${model.year}` : ""}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${model.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                            }`}
                        >
                          {model.active ? "Activo" : "Oculto"}
                        </span>
                      </div>

                      {model.subtitle && (
                        <p className="mt-4 text-sm font-bold leading-6 text-slate-600">
                          {model.subtitle}
                        </p>
                      )}

                      {model.description && (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                          {model.description}
                        </p>
                      )}

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                            Precio desde
                          </p>

                          <p className="mt-1 text-sm font-black text-[var(--rise-blue)]">
                            {model.priceFrom
                              ? formatCurrency(model.priceFrom)
                              : "Sin precio"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                            Tipo
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-700">
                            {getCategoryLabel(model.categoryType)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                            Orden
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-700">
                            {model.sortOrder}
                          </p>
                        </div>
                      </div>

                      {hasIssues && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {!image && (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                              Sin imagen
                            </span>
                          )}

                          {!model.description?.trim() && (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                              Sin descripción
                            </span>
                          )}

                          {!model.priceFrom && (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                              Sin precio base
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <aside className="border-t border-slate-100 bg-slate-50 p-5 xl:border-l xl:border-t-0">
                      <div className="grid gap-3">
                        <Link
                          href={`/admin/catalogo/${model.id}/editar`}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                        >
                          Editar modelo
                          <ArrowRight size={17} />
                        </Link>

                        <Link
                          href="/admin/inventario/nuevo"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-100"
                        >
                          <Car size={17} />
                          Crear unidad
                        </Link>

                        <form action={toggleCatalogModelActive}>
                          <input type="hidden" name="modelId" value={model.id} />
                          <input
                            type="hidden"
                            name="active"
                            value={String(model.active)}
                          />

                          <button
                            type="submit"
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                          >
                            {model.active ? (
                              <>
                                <EyeOff size={17} />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <Eye size={17} />
                                Mostrar
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    </aside>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
              <Tags size={48} className="mx-auto text-slate-400" />

              <h3 className="mt-4 text-2xl font-black">
                No hay modelos con ese criterio
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Cambia los filtros o registra un nuevo modelo comercial.
              </p>

              <Link
                href="/admin/catalogo/nuevo"
                className="mt-5 inline-flex rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                Registrar modelo
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}