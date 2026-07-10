import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BadgeCheck,
  Car,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderTree,
  Layers3,
  Plus,
  Save,
  ShieldAlert,
  Tags,
  Trash2,
} from "lucide-react";
import { VehicleCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type AdminBrandsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function getTextValue(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) ?? ""
  ).trim();
}

function getBrandCategory(
  value: FormDataEntryValue | null
) {
  const categoryValue = String(
    value || VehicleCategory.TODOTERRENO
  );

  const validCategories: VehicleCategory[] = [
    VehicleCategory.AUTO,
    VehicleCategory.MOTO,
    VehicleCategory.TODOTERRENO,
  ];

  return validCategories.includes(
    categoryValue as VehicleCategory
  )
    ? (categoryValue as VehicleCategory)
    : VehicleCategory.TODOTERRENO;
}

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

function revalidateBrandPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/marcas");
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/catalogo/nuevo");
  revalidatePath(
    "/admin/catalogo/categorias"
  );
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/inventario/nuevo");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
}

async function createBrand(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const name = getTextValue(
    formData,
    "name"
  );

  const category = getBrandCategory(
    formData.get("category")
  );

  const active =
    formData.get("active") === "on";

  if (!name) {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        "El nombre de la marca es obligatorio."
      )}`
    );
  }

  const existingBrand =
    await prisma.brand.findFirst({
      where: {
        name,
      },
    });

  if (existingBrand) {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        `La marca "${name}" ya existe.`
      )}`
    );
  }

  await prisma.brand.create({
    data: {
      name,
      category,
      active,
    },
  });

  revalidateBrandPaths();

  redirect(
    `/admin/marcas?success=${encodeURIComponent(
      "Marca creada correctamente."
    )}`
  );
}

async function updateBrand(
  brandId: number,
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const name = getTextValue(
    formData,
    "name"
  );

  const category = getBrandCategory(
    formData.get("category")
  );

  const active =
    formData.get("active") === "on";

  if (!brandId || !name) {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        "No se pudo actualizar la marca."
      )}`
    );
  }

  const existingBrand =
    await prisma.brand.findFirst({
      where: {
        name,

        NOT: {
          id: brandId,
        },
      },
    });

  if (existingBrand) {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        `Ya existe otra marca con el nombre "${name}".`
      )}`
    );
  }

  await prisma.brand.update({
    where: {
      id: brandId,
    },

    data: {
      name,
      category,
      active,
    },
  });

  revalidateBrandPaths();

  redirect(
    `/admin/marcas?success=${encodeURIComponent(
      "Marca actualizada correctamente."
    )}`
  );
}

async function toggleBrandActive(
  brandId: number
) {
  "use server";

  await requireAdmin();

  if (!brandId) {
    return;
  }

  const brand =
    await prisma.brand.findUnique({
      where: {
        id: brandId,
      },

      select: {
        active: true,
      },
    });

  if (!brand) {
    return;
  }

  await prisma.brand.update({
    where: {
      id: brandId,
    },

    data: {
      active: !brand.active,
    },
  });

  revalidateBrandPaths();
}

async function deleteBrand(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const brandId = Number(
    formData.get("brandId")
  );

  const confirmText = getTextValue(
    formData,
    "confirmText"
  );

  if (!brandId) {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        "No se pudo identificar la marca."
      )}`
    );
  }

  if (confirmText !== "ELIMINAR") {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        "Para eliminar la marca debes escribir ELIMINAR."
      )}`
    );
  }

  const brand =
    await prisma.brand.findUnique({
      where: {
        id: brandId,
      },

      include: {
        vehicles: true,
        catalogModels: true,
        catalogCategories: true,
      },
    });

  if (!brand) {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        "La marca ya no existe."
      )}`
    );
  }

  if (brand.vehicles.length > 0) {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        `No se puede eliminar "${brand.name}" porque tiene ${brand.vehicles.length} vehículo(s) asociado(s).`
      )}`
    );
  }

  if (brand.catalogModels.length > 0) {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        `No se puede eliminar "${brand.name}" porque tiene ${brand.catalogModels.length} modelo(s) de catálogo asociado(s).`
      )}`
    );
  }

  if (
    brand.catalogCategories.length > 0
  ) {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        `No se puede eliminar "${brand.name}" porque tiene ${brand.catalogCategories.length} categoría(s) asociada(s).`
      )}`
    );
  }

  await prisma.brand.delete({
    where: {
      id: brandId,
    },
  });

  revalidateBrandPaths();

  redirect(
    `/admin/marcas?success=${encodeURIComponent(
      "Marca eliminada correctamente."
    )}`
  );
}

export default async function AdminBrandsPage({
  searchParams,
}: AdminBrandsPageProps) {
  await requireAdmin();

  const params = await searchParams;

  const brands =
    await prisma.brand.findMany({
      include: {
        _count: {
          select: {
            vehicles: true,
            catalogModels: true,
            catalogCategories: true,
          },
        },
      },

      orderBy: [
        {
          active: "desc",
        },
        {
          name: "asc",
        },
      ],
    });

  const totalBrands = brands.length;

  const activeBrands =
    brands.filter(
      (brand) => brand.active
    ).length;

  const hiddenBrands =
    totalBrands - activeBrands;

  const brandsWithCatalog =
    brands.filter(
      (brand) =>
        brand._count.catalogModels > 0
    ).length;

  const brandsWithoutRelations =
    brands.filter(
      (brand) =>
        brand._count.vehicles === 0 &&
        brand._count.catalogModels === 0 &&
        brand._count.catalogCategories === 0
    ).length;

  const stats = [
    {
      label: "Marcas registradas",
      value: totalBrands,
      description:
        "Total de marcas en el sistema.",
      icon: Tags,
      tone: "navy" as const,
    },
    {
      label: "Marcas activas",
      value: activeBrands,
      description:
        "Disponibles para catálogo e inventario.",
      icon: Eye,
      tone: "emerald" as const,
    },
    {
      label: "Marcas ocultas",
      value: hiddenBrands,
      description:
        "No disponibles para nuevos registros.",
      icon: EyeOff,
      tone: "slate" as const,
    },
    {
      label: "Con catálogo",
      value: brandsWithCatalog,
      description:
        "Marcas con modelos comerciales.",
      icon: BadgeCheck,
      tone: "blue" as const,
    },
  ];

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
              <Tags size={15} />
              Administración
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
              Marcas
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              Administra las marcas utilizadas en
              catálogo, categorías, inventario y
              páginas públicas del sitio.
            </p>
          </div>

          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#dfe7ec] backdrop-blur-sm md:h-16 md:w-16">
            <Layers3 size={29} />
          </div>
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
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>{params.success}</span>
        </div>
      )}

      {/* Estadísticas */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <BrandStatCard
            key={stat.label}
            {...stat}
          />
        ))}
      </section>

      {/* Nueva marca */}
      <section className="mt-6 overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-100 bg-[#f8fafb] p-5 md:p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-7 bg-[#192a3a]" />

                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                  Alta rápida
                </p>
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
                Nueva marca
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Crea una marca para comenzar a
                registrar categorías, modelos y
                unidades reales.
              </p>
            </div>

            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#192a3a] text-white">
              <Plus size={20} />
            </span>
          </div>
        </div>

        <form
          action={createBrand}
          className="grid gap-5 p-5 md:grid-cols-2 md:p-6 xl:grid-cols-[minmax(0,1.4fr)_260px_230px_180px]"
        >
          <FormInput
            label="Nombre de marca"
            name="name"
            required
            placeholder="Ej. Can-Am, Polaris o Zeekr"
          />

          <FormSelect
            label="Tipo comercial"
            name="category"
            defaultValue={
              VehicleCategory.TODOTERRENO
            }
          >
            <option
              value={
                VehicleCategory.TODOTERRENO
              }
            >
              Todoterreno
            </option>

            <option
              value={VehicleCategory.MOTO}
            >
              Moto
            </option>

            <option
              value={VehicleCategory.AUTO}
            >
              Auto
            </option>
          </FormSelect>

          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
              Estado inicial
            </span>

            <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-[#f8fafb] px-4">
              <input
                name="active"
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-slate-300 accent-[#192a3a]"
              />

              <span className="text-sm font-black text-slate-700">
                Marca activa
              </span>
            </div>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
            >
              <Plus size={17} />
              Crear marca
            </button>
          </div>
        </form>
      </section>

      {/* Listado */}
      <section className="mt-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#192a3a]" />

              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                Registro
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
              Marcas registradas
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Modifica el nombre, tipo comercial,
              estado y relaciones de cada marca.
            </p>
          </div>

          <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600">
            {brands.length} marca
            {brands.length === 1 ? "" : "s"}
          </span>
        </div>

        {brands.length > 0 ? (
          <div className="mt-5 grid gap-5">
            {brands.map((brand) => {
              const hasRelations =
                brand._count.vehicles > 0 ||
                brand._count.catalogModels > 0 ||
                brand._count
                  .catalogCategories > 0;

              return (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  hasRelations={hasRelations}
                />
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <Car
              size={50}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-2xl font-black">
              Sin marcas registradas
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Utiliza el formulario superior para
              registrar la primera marca.
            </p>
          </div>
        )}
      </section>

      {/* Resumen */}
      <section className="mt-6 rounded-[18px] border border-[#192a3a]/10 bg-[#e7edf1] px-5 py-4">
        <p className="text-sm font-black text-[#192a3a]">
          Resumen de marcas
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Hay {brandsWithoutRelations} marcas sin
          vehículos, modelos ni categorías
          relacionadas. Estas pueden eliminarse si
          ya no serán utilizadas.
        </p>
      </section>
    </div>
  );
}

function BrandStatCard({
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
  tone:
  | "navy"
  | "blue"
  | "emerald"
  | "slate";
}) {
  const tones = {
    navy: "border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]",
    blue:
      "border-blue-100 bg-blue-50 text-blue-700",
    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-700",
    slate:
      "border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <article className="rounded-[20px] border border-black/8 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
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

function BrandCard({
  brand,
  hasRelations,
}: {
  brand: {
    id: number;
    name: string;
    category: VehicleCategory;
    active: boolean;

    _count: {
      vehicles: number;
      catalogModels: number;
      catalogCategories: number;
    };
  };

  hasRelations: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:border-[#192a3a]/25 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="p-5 md:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#192a3a]">
                Marca #{brand.id}
              </p>

              <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] md:text-3xl">
                {brand.name}
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${brand.active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                >
                  {brand.active
                    ? "Activa"
                    : "Oculta"}
                </span>

                <span className="rounded-full border border-[#192a3a]/10 bg-[#e7edf1] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#192a3a]">
                  {getCategoryLabel(
                    brand.category
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-[18px] border border-slate-100 bg-[#f8fafb] p-3">
              <MiniStat
                title="Vehículos"
                value={brand._count.vehicles}
                icon={Car}
              />

              <MiniStat
                title="Modelos"
                value={
                  brand._count.catalogModels
                }
                icon={Layers3}
              />

              <MiniStat
                title="Categorías"
                value={
                  brand._count
                    .catalogCategories
                }
                icon={FolderTree}
              />
            </div>
          </div>

          <form
            action={updateBrand.bind(
              null,
              brand.id
            )}
            className="mt-6 grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_240px_200px_auto]"
          >
            <FormInput
              label="Nombre de marca"
              name="name"
              defaultValue={brand.name}
              required
            />

            <FormSelect
              label="Tipo comercial"
              name="category"
              defaultValue={brand.category}
            >
              <option
                value={
                  VehicleCategory.TODOTERRENO
                }
              >
                Todoterreno
              </option>

              <option
                value={VehicleCategory.MOTO}
              >
                Moto
              </option>

              <option
                value={VehicleCategory.AUTO}
              >
                Auto
              </option>
            </FormSelect>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                Estado
              </span>

              <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-[#f8fafb] px-4">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={brand.active}
                  className="h-5 w-5 rounded border-slate-300 accent-[#192a3a]"
                />

                <span className="text-sm font-black text-slate-700">
                  Activa
                </span>
              </div>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-xs font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
              >
                <Save size={16} />
                Guardar
              </button>
            </div>
          </form>
        </div>

        <BrandActions
          brandId={brand.id}
          active={brand.active}
          hasRelations={hasRelations}
          counts={brand._count}
        />
      </div>
    </article>
  );
}

function BrandActions({
  brandId,
  active,
  hasRelations,
  counts,
}: {
  brandId: number;
  active: boolean;
  hasRelations: boolean;

  counts: {
    vehicles: number;
    catalogModels: number;
    catalogCategories: number;
  };
}) {
  return (
    <aside className="border-t border-slate-100 bg-[#f8fafb] p-5 2xl:border-l 2xl:border-t-0">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        Acciones
      </p>

      <div className="mt-4 grid gap-3">
        <form
          action={toggleBrandActive.bind(
            null,
            brandId
          )}
        >
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a] active:scale-[0.98]"
          >
            {active ? (
              <>
                <EyeOff size={16} />
                Ocultar marca
              </>
            ) : (
              <>
                <Eye size={16} />
                Activar marca
              </>
            )}
          </button>
        </form>

        <div
          className={`rounded-[16px] border p-4 ${hasRelations
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50"
            }`}
        >
          <div className="flex gap-3">
            {hasRelations ? (
              <ShieldAlert
                size={18}
                className="mt-0.5 shrink-0 text-amber-600"
              />
            ) : (
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
            )}

            <div>
              <p
                className={`text-xs font-black ${hasRelations
                    ? "text-amber-700"
                    : "text-emerald-700"
                  }`}
              >
                {hasRelations
                  ? "Marca relacionada"
                  : "Puede eliminarse"}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                {hasRelations
                  ? `${counts.vehicles} vehículos, ${counts.catalogModels} modelos y ${counts.catalogCategories} categorías asociadas.`
                  : "Esta marca no tiene información relacionada."}
              </p>
            </div>
          </div>
        </div>

        <details className="group rounded-xl border border-red-200 bg-red-50">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-red-700">
            <Trash2 size={15} />
            Eliminar marca
          </summary>

          <div className="border-t border-red-100 p-4">
            <div className="flex gap-3">
              <ShieldAlert
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="text-xs font-black text-red-700">
                  {hasRelations
                    ? "Eliminación bloqueada"
                    : "Acción irreversible"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {hasRelations
                    ? "Primero elimina o reasigna los registros asociados."
                    : "Confirma escribiendo ELIMINAR."}
                </p>
              </div>
            </div>

            <form
              action={deleteBrand}
              className="mt-4 grid gap-3"
            >
              <input
                type="hidden"
                name="brandId"
                value={brandId}
              />

              <input
                name="confirmText"
                placeholder="Escribe ELIMINAR"
                autoComplete="off"
                disabled={hasRelations}
                className="h-11 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700 outline-none placeholder:text-red-300 focus:border-red-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />

              <button
                type="submit"
                disabled={hasRelations}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Trash2 size={15} />
                Eliminar definitivamente
              </button>
            </form>
          </div>
        </details>
      </div>
    </aside>
  );
}

function FormInput({
  label,
  name,
  required = false,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      />
    </label>
  );
}

function FormSelect({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <select
        name={name}
        defaultValue={defaultValue}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      >
        {children}
      </select>
    </label>
  );
}

function MiniStat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="min-w-[70px] text-center">
      <Icon
        size={15}
        className="mx-auto text-[#192a3a]"
      />

      <p className="mt-2 text-lg font-black text-[#192a3a]">
        {value}
      </p>

      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
        {title}
      </p>
    </div>
  );
}