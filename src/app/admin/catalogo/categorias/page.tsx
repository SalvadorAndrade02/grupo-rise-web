import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderTree,
  Layers3,
  Plus,
  Save,
  Tags,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { ConfirmSubmitButton } from "@/components/admin/ui/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

type CatalogCategoriesPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function getNumberValue(
  formData: FormData,
  fieldName: string
) {
  const value = Number(
    formData.get(fieldName)
  );

  return Number.isFinite(value)
    ? value
    : 0;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function getUniqueCategorySlug(
  brandId: number,
  name: string
) {
  const baseSlug =
    slugify(name) || "categoria";

  let slug = baseSlug;
  let suffix = 2;

  while (
    await prisma.catalogCategory.findUnique({
      where: {
        brandId_slug: {
          brandId,
          slug,
        },
      },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function createCatalogCategory(
  formData: FormData
) {
  "use server";

  await requireAdmin();


  const brandId = getNumberValue(
    formData,
    "brandId"
  );

  const parentId = getNumberValue(
    formData,
    "parentId"
  );

  const sortOrder = getNumberValue(
    formData,
    "sortOrder"
  );

  const name = String(
    formData.get("name") || ""
  ).trim();

  const active =
    formData.get("active") === "on";

  if (!brandId || !name) {
    redirect(
      `/admin/catalogo/categorias?error=${encodeURIComponent(
        "Selecciona una marca y captura el nombre de la categoría."
      )}`
    );
  }

  if (parentId) {
    const parent =
      await prisma.catalogCategory.findUnique({
        where: {
          id: parentId,
        },
      });

    if (
      !parent ||
      parent.brandId !== brandId
    ) {
      redirect(
        `/admin/catalogo/categorias?error=${encodeURIComponent(
          "La categoría padre debe pertenecer a la misma marca."
        )}`
      );
    }
  }

  const slug =
    await getUniqueCategorySlug(
      brandId,
      name
    );

  await prisma.catalogCategory.create({
    data: {
      brandId,
      parentId: parentId || null,
      name,
      slug,
      active,
      sortOrder,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/catalogo");
  revalidatePath(
    "/admin/catalogo/nuevo"
  );
  revalidatePath(
    "/admin/catalogo/categorias"
  );
  revalidatePath(
    "/admin/inventario/nuevo"
  );

  redirect(
    `/admin/catalogo/categorias?success=${encodeURIComponent(
      "Categoría creada correctamente."
    )}`
  );
}

async function toggleCatalogCategoryActive(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const categoryId = Number(
    formData.get("categoryId")
  );

  const active =
    String(formData.get("active")) ===
    "true";

  if (!categoryId) {
    return;
  }

  await prisma.catalogCategory.update({
    where: {
      id: categoryId,
    },

    data: {
      active: !active,
    },
  });

  revalidatePath("/admin/catalogo");
  revalidatePath(
    "/admin/catalogo/nuevo"
  );
  revalidatePath(
    "/admin/catalogo/categorias"
  );
  revalidatePath(
    "/admin/inventario/nuevo"
  );
}

async function deleteCatalogCategory(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const categoryId = Number(
    formData.get("categoryId")
  );

  if (
    !Number.isInteger(categoryId) ||
    categoryId <= 0
  ) {
    redirect(
      `/admin/catalogo/categorias?error=${encodeURIComponent(
        "No se pudo identificar la categoría."
      )}`
    );
  }

  const category =
    await prisma.catalogCategory.findUnique({
      where: {
        id: categoryId,
      },

      include: {
        children: {
          select: {
            id: true,
          },
        },

        models: {
          select: {
            id: true,
          },
        },
      },
    });

  if (!category) {
    redirect(
      `/admin/catalogo/categorias?error=${encodeURIComponent(
        "La categoría ya no existe."
      )}`
    );
  }

  if (category.children.length > 0) {
    redirect(
      `/admin/catalogo/categorias?error=${encodeURIComponent(
        `No se puede eliminar "${category.name}" porque tiene ${category.children.length} subcategoría(s). Primero elimina u oculta sus subcategorías.`
      )}`
    );
  }

  if (category.models.length > 0) {
    redirect(
      `/admin/catalogo/categorias?error=${encodeURIComponent(
        `No se puede eliminar "${category.name}" porque tiene ${category.models.length} modelo(s) asociado(s). Primero cambia la categoría de esos modelos.`
      )}`
    );
  }

  await prisma.catalogCategory.delete({
    where: {
      id: categoryId,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/catalogo");
  revalidatePath(
    "/admin/catalogo/nuevo"
  );
  revalidatePath(
    "/admin/catalogo/categorias"
  );
  revalidatePath(
    "/admin/inventario/nuevo"
  );

  redirect(
    `/admin/catalogo/categorias?success=${encodeURIComponent(
      "Categoría eliminada correctamente."
    )}`
  );
}

export default async function CatalogCategoriesPage({
  searchParams,
}: CatalogCategoriesPageProps) {

  await requireAdmin();
  const params = await searchParams;

  const [brands, categories] =
    await Promise.all([
      prisma.brand.findMany({
        where: {
          active: true,
        },

        orderBy: {
          name: "asc",
        },
      }),

      prisma.catalogCategory.findMany({
        include: {
          brand: true,
          parent: true,
          children: true,
          models: true,
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

  const activeCategories =
    categories.filter(
      (category) => category.active
    );

  const hiddenCategories =
    categories.filter(
      (category) => !category.active
    );

  const parentCategories =
    categories.filter(
      (category) => !category.parentId
    );

  const childCategories =
    categories.filter(
      (category) => category.parentId
    );

  const stats = [
    {
      label: "Categorías",
      value: categories.length,
      description:
        "Total de categorías registradas.",
      icon: FolderTree,
      tone: "navy" as const,
    },
    {
      label: "Activas",
      value: activeCategories.length,
      description:
        "Disponibles para modelos nuevos.",
      icon: BadgeCheck,
      tone: "emerald" as const,
    },
    {
      label: "Principales",
      value: parentCategories.length,
      description:
        "Categorías sin nivel superior.",
      icon: Layers3,
      tone: "amber" as const,
    },
    {
      label: "Subcategorías",
      value: childCategories.length,
      description:
        "Categorías asociadas a otra.",
      icon: Tags,
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
            <Link
              href="/admin/catalogo"
              className="inline-flex items-center gap-2 text-xs font-black !text-white/70 transition hover:!text-white [&_*]:!text-current"
            >
              <ArrowLeft size={16} />
              <span>Volver al catálogo</span>
            </Link>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
              <FolderTree size={15} />
              Organización del catálogo
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
              Categorías por marca
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              Organiza los modelos mediante
              categorías principales y
              subcategorías específicas para cada
              marca.
            </p>
          </div>

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
          <CategoryStatCard
            key={stat.label}
            {...stat}
          />
        ))}
      </section>

      {/* Formulario y listado */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        {/* Nueva categoría */}
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <form
            action={createCatalogCategory}
            className="overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
          >
            <div className="border-b border-slate-100 bg-[#f8fafb] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-px w-7 bg-[#192a3a]" />

                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#192a3a]">
                      Nueva categoría
                    </p>
                  </div>

                  <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
                    Crear categoría
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Registra una categoría principal
                    o una subcategoría para una
                    marca.
                  </p>
                </div>

                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#192a3a] !text-white [&_*]:!text-current">
                  <FolderTree size={20} />
                </span>
              </div>
            </div>

            <div className="grid gap-5 p-5 md:p-6">
              <FormSelect
                label="Marca"
                name="brandId"
                required
              >
                <option value="">
                  Selecciona una marca
                </option>

                {brands.map((brand) => (
                  <option
                    key={brand.id}
                    value={brand.id}
                  >
                    {brand.name}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                label="Nombre de categoría"
                name="name"
                required
                placeholder="Ej. Side-by-Side"
              />

              <FormSelect
                label="Categoría padre"
                name="parentId"
                description="La categoría padre debe pertenecer a la misma marca."
              >
                <option value="">
                  Sin categoría padre
                </option>

                {parentCategories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.brand.name} ·{" "}
                      {category.name}
                    </option>
                  )
                )}
              </FormSelect>

              <FormInput
                label="Orden"
                name="sortOrder"
                type="number"
                defaultValue={0}
                description="Los números menores aparecen primero."
              />

              <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-slate-200 bg-[#f8fafb] p-4 transition hover:border-[#192a3a]/30">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-[#192a3a]"
                />

                <span>
                  <span className="block text-sm font-black text-slate-700">
                    Categoría activa
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Estará disponible al registrar o
                    editar modelos.
                  </span>
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#192a3a] bg-[#192a3a] px-5 text-sm font-black !text-white transition hover:border-[#29465c] hover:bg-[#29465c] hover:!text-white active:scale-[0.98] [&_*]:!text-current"
              >
                <Save size={17} />
                <span>Guardar categoría</span>
              </button>
            </div>
          </form>
        </aside>

        {/* Categorías existentes */}
        <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-7 bg-[#192a3a]" />

                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                  Categorías registradas
                </p>
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
                Organización actual
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Revisa jerarquías, modelos
                relacionados y visibilidad.
              </p>
            </div>

            <span className="w-fit rounded-full border border-slate-200 bg-[#f8fafb] px-4 py-2 text-xs font-black text-slate-600">
              {categories.length} categoría
              {categories.length === 1
                ? ""
                : "s"}
            </span>
          </div>

          {categories.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[20px] border border-dashed border-slate-300 bg-[#f8fafb] p-10 text-center">
              <FolderTree
                size={48}
                className="mx-auto text-slate-400"
              />

              <h3 className="mt-4 text-2xl font-black">
                Sin categorías todavía
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Utiliza el formulario para crear la
                primera categoría del catálogo.
              </p>
            </div>
          )}
        </section>
      </section>

      {/* Resumen */}
      <section className="mt-6 rounded-[18px] border border-[#192a3a]/10 bg-[#e7edf1] px-5 py-4">
        <p className="text-sm font-black text-[#192a3a]">
          Resumen de categorías
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Hay {hiddenCategories.length} categorías
          ocultas y {childCategories.length} que
          dependen de una categoría principal.
        </p>
      </section>
    </div>
  );
}

function CategoryStatCard({
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
  | "emerald"
  | "amber"
  | "blue";
}) {
  const tones = {
    navy: "border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]",
    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber:
      "border-amber-100 bg-amber-50 text-amber-700",
    blue:
      "border-blue-100 bg-blue-50 text-blue-700",
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

function FormInput({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required = false,
  description,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  required?: boolean;
  description?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      />

      {description && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}
    </label>
  );
}

function FormSelect({
  label,
  name,
  required = false,
  description,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <select
        name={name}
        required={required}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      >
        {children}
      </select>

      {description && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}
    </label>
  );
}

function CategoryCard({
  category,
}: {
  category: {
    id: number;
    name: string;
    slug: string;
    active: boolean;
    sortOrder: number;
    parent: {
      name: string;
    } | null;
    brand: {
      name: string;
    };
    children: {
      id: number;
    }[];
    models: {
      id: number;
    }[];
  };
}) {
  const canDelete =
    category.children.length === 0 &&
    category.models.length === 0;

  return (
    <article className="flex flex-col rounded-[20px] border border-slate-100 bg-[#f8fafb] p-5 transition hover:border-[#192a3a]/20 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#192a3a]">
            {category.brand.name}
          </p>

          <h3 className="mt-2 truncate text-xl font-black tracking-[-0.03em]">
            {category.name}
          </h3>

          <p className="mt-2 text-xs font-semibold text-slate-500">
            {category.parent
              ? `Subcategoría de ${category.parent.name}`
              : "Categoría principal"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${category.active
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-slate-100 text-slate-600"
            }`}
        >
          {category.active
            ? "Activa"
            : "Oculta"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <CategoryDetail
          label="Modelos"
          value={category.models.length}
        />

        <CategoryDetail
          label="Subcategorías"
          value={category.children.length}
        />

        <CategoryDetail
          label="Orden"
          value={category.sortOrder}
        />
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <form
          action={
            toggleCatalogCategoryActive
          }
        >
          <input
            type="hidden"
            name="categoryId"
            value={category.id}
          />

          <input
            type="hidden"
            name="active"
            value={String(category.active)}
          />

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#192a3a]/15 bg-white px-4 text-xs font-black !text-slate-600 transition hover:border-[#192a3a]/30 hover:bg-[#eef0ee] hover:!text-[#192a3a] active:scale-[0.98] [&_*]:!text-current"
          >
            {category.active ? (
              <>
                <EyeOff size={16} />
                <span>Ocultar categoría</span>
              </>
            ) : (
              <>
                <Eye size={16} />
                <span>Mostrar categoría</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-xs font-black text-red-700">
                {canDelete
                  ? "Eliminar categoría"
                  : "Categoría relacionada"}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {canDelete
                  ? "Se solicitará una confirmación antes de eliminarla definitivamente."
                  : `No puede eliminarse porque tiene ${category.models.length} modelo(s) y ${category.children.length} subcategoría(s) relacionadas.`}
              </p>
            </div>
          </div>

          <form
            action={deleteCatalogCategory}
            className="mt-4"
          >
            <input
              type="hidden"
              name="categoryId"
              value={category.id}
            />

            <ConfirmSubmitButton
              confirmMessage={`¿Seguro que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`}
              pendingText="Eliminando categoría..."
              disabled={!canDelete}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-red-600 bg-red-600 px-4 text-[10px] font-black uppercase tracking-[0.1em] !text-white transition hover:border-red-700 hover:bg-red-700 hover:!text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:border-red-200 disabled:bg-red-200 disabled:!text-red-400 [&_*]:!text-current"
            >
              <Trash2 size={15} />

              <span>
                {canDelete
                  ? "Eliminar categoría"
                  : "No se puede eliminar"}
              </span>
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>
    </article>
  );
}

function CategoryDetail({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[14px] border border-slate-100 bg-white p-3 text-center">
      <p className="text-lg font-black text-[#192a3a]">
        {value}
      </p>

      <p className="mt-1 truncate text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
    </div>
  );
}