import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  BadgeCheck,
  Eye,
  EyeOff,
  FolderTree,
  Layers3,
  Plus,
  Save,
  Tags,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CatalogCategoriesPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function getNumberValue(formData: FormData, fieldName: string) {
  const value = Number(formData.get(fieldName));

  return Number.isFinite(value) ? value : 0;
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

async function getUniqueCategorySlug(brandId: number, name: string) {
  const baseSlug = slugify(name) || "categoria";
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

async function createCatalogCategory(formData: FormData) {
  "use server";

  const brandId = getNumberValue(formData, "brandId");
  const parentId = getNumberValue(formData, "parentId");
  const sortOrder = getNumberValue(formData, "sortOrder");

  const name = String(formData.get("name") || "").trim();
  const active = formData.get("active") === "on";

  if (!brandId || !name) {
    redirect(
      `/admin/catalogo/categorias?error=${encodeURIComponent(
        "Selecciona una marca y captura el nombre de la categoría."
      )}`
    );
  }

  if (parentId) {
    const parent = await prisma.catalogCategory.findUnique({
      where: {
        id: parentId,
      },
    });

    if (!parent || parent.brandId !== brandId) {
      redirect(
        `/admin/catalogo/categorias?error=${encodeURIComponent(
          "La categoría padre debe pertenecer a la misma marca."
        )}`
      );
    }
  }

  const slug = await getUniqueCategorySlug(brandId, name);

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
  revalidatePath("/admin/catalogo/nuevo");
  revalidatePath("/admin/catalogo/categorias");
  revalidatePath("/admin/inventario/nuevo");

  redirect(
    `/admin/catalogo/categorias?success=${encodeURIComponent(
      "Categoría creada correctamente."
    )}`
  );
}

async function toggleCatalogCategoryActive(formData: FormData) {
  "use server";

  const categoryId = Number(formData.get("categoryId"));
  const active = String(formData.get("active")) === "true";

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
  revalidatePath("/admin/catalogo/nuevo");
  revalidatePath("/admin/catalogo/categorias");
  revalidatePath("/admin/inventario/nuevo");
}

async function deleteCatalogCategory(formData: FormData) {
  "use server";

  const categoryId = Number(formData.get("categoryId"));
  const confirmText = String(formData.get("confirmText") || "").trim();

  if (!categoryId) {
    redirect(
      `/admin/catalogo/categorias?error=${encodeURIComponent(
        "No se pudo identificar la categoría."
      )}`
    );
  }

  if (confirmText !== "ELIMINAR") {
    redirect(
      `/admin/catalogo/categorias?error=${encodeURIComponent(
        "Para eliminar la categoría debes escribir ELIMINAR."
      )}`
    );
  }

  const category = await prisma.catalogCategory.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      children: true,
      models: true,
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
        `No se puede eliminar "${category.name}" porque tiene ${category.models.length} modelo(s) asociado(s). Primero edita esos modelos y cambia su categoría.`
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
  revalidatePath("/admin/catalogo/nuevo");
  revalidatePath("/admin/catalogo/categorias");
  revalidatePath("/admin/inventario/nuevo");

  redirect(
    `/admin/catalogo/categorias?success=${encodeURIComponent(
      "Categoría eliminada correctamente."
    )}`
  );
}

export default async function CatalogCategoriesPage({
  searchParams,
}: CatalogCategoriesPageProps) {
  const params = await searchParams;

  const [brands, categories] = await Promise.all([
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

  const activeCategories = categories.filter((category) => category.active);
  const parentCategories = categories.filter((category) => !category.parentId);
  const childCategories = categories.filter((category) => category.parentId);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <Link
            href="/admin/catalogo"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[var(--rise-blue)]"
          >
            <ArrowLeft size={18} />
            Volver al catálogo base
          </Link>

          <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
            Catálogo base
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Categorías por marca
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Crea categorías comerciales para organizar los modelos base. Estas
            categorías aparecerán al registrar modelos y unidades reales.
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

      {params.error && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {params.error}
        </div>
      )}

      {params.success && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {params.success}
        </div>
      )}

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <FolderTree size={24} className="text-[var(--rise-blue)]" />
          <p className="mt-4 text-4xl font-black">{categories.length}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">
            Categorías
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <BadgeCheck size={24} className="text-emerald-600" />
          <p className="mt-4 text-4xl font-black">
            {activeCategories.length}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">
            Activas
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Layers3 size={24} className="text-amber-600" />
          <p className="mt-4 text-4xl font-black">
            {parentCategories.length}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">
            Principales
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Tags size={24} className="text-purple-600" />
          <p className="mt-4 text-4xl font-black">{childCategories.length}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">
            Subcategorías
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <form
            action={createCatalogCategory}
            className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/5 md:p-6"
          >
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Nueva categoría
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Crear categoría
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Selecciona una marca y captura una categoría principal o una
              subcategoría.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Marca
                </span>

                <select
                  name="brandId"
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="">Selecciona una marca</option>

                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Nombre de categoría
                </span>

                <input
                  name="name"
                  required
                  placeholder="Ej. Side-by-Side, Cuatrimotos, 350, Ranger"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Categoría padre
                </span>

                <select
                  name="parentId"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="">Sin categoría padre</option>

                  {parentCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.brand.name} · {category.name}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  Si eliges padre, debe pertenecer a la misma marca.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Orden
                </span>

                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={0}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="mt-1 h-5 w-5 rounded border-slate-300"
                />

                <span>
                  <span className="block text-sm font-black text-slate-700">
                    Categoría activa
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Si está activa, aparecerá al crear modelos.
                  </span>
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                <Save size={18} />
                Guardar categoría
              </button>
            </div>
          </form>
        </aside>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Categorías registradas
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Organización del catálogo
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {categories.length > 0 ? (
              categories.map((category) => (
                <article
                  key={category.id}
                  className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                        {category.brand.name}
                      </p>

                      <h3 className="mt-2 text-2xl font-black text-[var(--rise-navy)]">
                        {category.name}
                      </h3>

                      <p className="mt-2 text-sm font-bold text-slate-500">
                        {category.parent
                          ? `Subcategoría de ${category.parent.name}`
                          : "Categoría principal"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${category.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                        }`}
                    >
                      {category.active ? "Activa" : "Oculta"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Modelos
                      </p>

                      <p className="mt-1 text-lg font-black text-[var(--rise-blue)]">
                        {category.models.length}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Subcategorías
                      </p>

                      <p className="mt-1 text-lg font-black text-[var(--rise-blue)]">
                        {category.children.length}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Orden
                      </p>

                      <p className="mt-1 text-lg font-black text-slate-700">
                        {category.sortOrder}
                      </p>
                    </div>
                  </div>

                  <form action={toggleCatalogCategoryActive} className="mt-4">
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
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                    >
                      {category.active ? (
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

                  <details className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <summary className="flex cursor-pointer items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700">
                      <Trash2 size={16} />
                      Eliminar categoría
                    </summary>

                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <div className="flex gap-3">
                        <AlertTriangle className="mt-1 shrink-0 text-red-600" size={20} />

                        <div>
                          <p className="text-sm font-black text-red-700">
                            Esta acción no se puede deshacer.
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Solo se permitirá eliminar si no tiene modelos ni subcategorías
                            asociadas.
                          </p>
                        </div>
                      </div>

                      <form action={deleteCatalogCategory} className="mt-4 grid gap-3">
                        <input type="hidden" name="categoryId" value={category.id} />

                        <input
                          name="confirmText"
                          placeholder="Escribe ELIMINAR"
                          className="h-10 rounded-2xl border border-red-100 bg-red-50 px-4 text-xs font-black text-red-700 outline-none transition placeholder:text-red-300 focus:border-red-300 focus:bg-white"
                        />

                        <button
                          type="submit"
                          className="h-10 rounded-2xl bg-red-600 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-700"
                        >
                          Eliminar definitivamente
                        </button>
                      </form>
                    </div>
                  </details>
                </article>
              ))
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <FolderTree size={48} className="mx-auto text-slate-400" />

                <h3 className="mt-4 text-2xl font-black">
                  Sin categorías todavía
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Crea la primera categoría para organizar modelos por marca.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}