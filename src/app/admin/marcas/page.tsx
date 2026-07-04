import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  BadgeCheck,
  Car,
  Eye,
  EyeOff,
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

function getTextValue(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function getBrandCategory(value: FormDataEntryValue | null) {
  const categoryValue = String(value || VehicleCategory.TODOTERRENO);

  const validCategories: VehicleCategory[] = [
    VehicleCategory.AUTO,
    VehicleCategory.MOTO,
    VehicleCategory.TODOTERRENO,
  ];

  return validCategories.includes(categoryValue as VehicleCategory)
    ? (categoryValue as VehicleCategory)
    : VehicleCategory.TODOTERRENO;
}

function getCategoryLabel(category: VehicleCategory) {
  const labels: Record<VehicleCategory, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category];
}

function revalidateBrandPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/marcas");
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/catalogo/nuevo");
  revalidatePath("/admin/catalogo/categorias");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/inventario/nuevo");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
}

async function createBrand(formData: FormData) {
  "use server";

  await requireAdmin();

  const name = getTextValue(formData, "name");
  const category = getBrandCategory(formData.get("category"));
  const active = formData.get("active") === "on";

  if (!name) {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        "El nombre de la marca es obligatorio."
      )}`
    );
  }

  const existingBrand = await prisma.brand.findFirst({
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

async function updateBrand(brandId: number, formData: FormData) {
  "use server";

  await requireAdmin();

  const name = getTextValue(formData, "name");
  const category = getBrandCategory(formData.get("category"));
  const active = formData.get("active") === "on";

  if (!brandId || !name) {
    redirect(
      `/admin/marcas?error=${encodeURIComponent(
        "No se pudo actualizar la marca."
      )}`
    );
  }

  const existingBrand = await prisma.brand.findFirst({
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

async function toggleBrandActive(brandId: number) {
  "use server";

  await requireAdmin();

  if (!brandId) {
    return;
  }

  const brand = await prisma.brand.findUnique({
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

async function deleteBrand(formData: FormData) {
  "use server";

  await requireAdmin();

  const brandId = Number(formData.get("brandId"));
  const confirmText = getTextValue(formData, "confirmText");

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

  const brand = await prisma.brand.findUnique({
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
      `/admin/marcas?error=${encodeURIComponent("La marca ya no existe.")}`
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

  if (brand.catalogCategories.length > 0) {
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

  const brands = await prisma.brand.findMany({
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
  const activeBrands = brands.filter((brand) => brand.active).length;
  const hiddenBrands = brands.filter((brand) => !brand.active).length;
  const brandsWithCatalog = brands.filter(
    (brand) => brand._count.catalogModels > 0
  ).length;

  return (
    <main className="space-y-8 pb-10">
      <section className="overflow-hidden rounded-[2.5rem] border border-[var(--rise-border)] bg-white shadow-sm">
        <div className="relative bg-[var(--rise-navy)] p-7 text-white md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.35),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.9),transparent_42%)]" />

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100 backdrop-blur">
                <Tags size={15} />
                Administración
              </p>

              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
                Marcas
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-blue-100 md:text-base">
                Administra las marcas utilizadas en catálogo base, categorías,
                inventario y páginas públicas del sitio.
              </p>
            </div>

            <div className="grid h-16 w-16 place-items-center rounded-[1.5rem] border border-white/15 bg-white/10 text-blue-100 backdrop-blur">
              <Layers3 size={32} />
            </div>
          </div>
        </div>

        {(params.error || params.success) && (
          <div className="p-6">
            {params.error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {params.error}
              </div>
            )}

            {params.success && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {params.success}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Marcas" value={totalBrands} icon={<Tags />} />
        <MetricCard title="Activas" value={activeBrands} icon={<Eye />} />
        <MetricCard title="Ocultas" value={hiddenBrands} icon={<EyeOff />} />
        <MetricCard
          title="Con catálogo"
          value={brandsWithCatalog}
          icon={<BadgeCheck />}
        />
      </section>

      <section className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Alta rápida
            </p>

            <h2 className="mt-3 text-3xl font-black text-[var(--rise-navy)]">
              Nueva marca
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Crea una marca para comenzar a cargar categorías, modelos base y
              unidades reales.
            </p>
          </div>

          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
            <Plus size={27} />
          </div>
        </div>

        <form
          action={createBrand}
          className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_260px_220px_180px]"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">
              Nombre de marca
            </span>

            <input
              name="name"
              required
              placeholder="Ej. Can-Am, Polaris, Zeekr"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[var(--rise-navy)] outline-none transition placeholder:text-slate-400 focus:border-[var(--rise-blue)] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">
              Tipo comercial
            </span>

            <select
              name="category"
              defaultValue={VehicleCategory.TODOTERRENO}
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[var(--rise-navy)] outline-none transition focus:border-[var(--rise-blue)] focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value={VehicleCategory.TODOTERRENO}>Todo terreno</option>
              <option value={VehicleCategory.MOTO}>Moto</option>
              <option value={VehicleCategory.AUTO}>Auto</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">
              Estado
            </span>

            <div className="flex h-14 items-center gap-3 rounded-2xl bg-slate-50 px-4">
              <input
                name="active"
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-slate-300"
              />

              <span className="text-sm font-black text-slate-700">
                Marca activa
              </span>
            </div>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-[var(--rise-blue)]"
            >
              <Plus size={18} />
              Crear
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Registro
            </p>

            <h2 className="mt-2 text-3xl font-black text-[var(--rise-navy)]">
              Marcas registradas
            </h2>
          </div>

          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm">
            {brands.length} marca(s)
          </p>
        </div>

        {brands.length > 0 ? (
          <div className="grid gap-5">
            {brands.map((brand) => {
              const hasRelations =
                brand._count.vehicles > 0 ||
                brand._count.catalogModels > 0 ||
                brand._count.catalogCategories > 0;

              return (
                <article
                  key={brand.id}
                  className="overflow-hidden rounded-[2.25rem] border border-[var(--rise-border)] bg-white shadow-sm transition hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <div className="grid gap-0 2xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="p-6 md:p-7">
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                            Marca
                          </p>

                          <h3 className="mt-2 text-3xl font-black leading-tight text-[var(--rise-navy)]">
                            {brand.name}
                          </h3>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${brand.active
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-200 text-slate-500"
                                }`}
                            >
                              {brand.active ? "Activa" : "Oculta"}
                            </span>

                            <span className="inline-flex rounded-full bg-[var(--rise-blue-soft)] px-3 py-1.5 text-xs font-black text-[var(--rise-blue)]">
                              {getCategoryLabel(brand.category)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 rounded-[1.5rem] bg-slate-50 p-4 text-center">
                          <MiniStat
                            title="Vehículos"
                            value={brand._count.vehicles}
                          />
                          <MiniStat
                            title="Modelos"
                            value={brand._count.catalogModels}
                          />
                          <MiniStat
                            title="Categorías"
                            value={brand._count.catalogCategories}
                          />
                        </div>
                      </div>

                      <form
                        action={updateBrand.bind(null, brand.id)}
                        className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_240px_180px]"
                      >
                        <label className="block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                            Nombre de marca
                          </span>

                          <input
                            name="name"
                            defaultValue={brand.name}
                            className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-[var(--rise-navy)] outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                            Tipo comercial
                          </span>

                          <select
                            name="category"
                            defaultValue={brand.category}
                            className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-[var(--rise-navy)] outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                          >
                            <option value={VehicleCategory.TODOTERRENO}>
                              Todo terreno
                            </option>
                            <option value={VehicleCategory.MOTO}>Moto</option>
                            <option value={VehicleCategory.AUTO}>Auto</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                            Estado
                          </span>

                          <div className="flex h-13 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                            <input
                              name="active"
                              type="checkbox"
                              defaultChecked={brand.active}
                              className="h-5 w-5 rounded border-slate-300"
                            />

                            <span className="text-sm font-black text-slate-700">
                              Activa
                            </span>
                          </div>
                        </label>

                        <div className="lg:col-span-3">
                          <button
                            type="submit"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                          >
                            <Save size={17} />
                            Guardar cambios
                          </button>
                        </div>
                      </form>
                    </div>

                    <aside className="border-t border-slate-100 bg-slate-50 p-6 2xl:border-l 2xl:border-t-0">
                      <div className="space-y-3">
                        <form action={toggleBrandActive.bind(null, brand.id)}>
                          <button
                            type="submit"
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                          >
                            {brand.active ? (
                              <>
                                <EyeOff size={17} />
                                Ocultar marca
                              </>
                            ) : (
                              <>
                                <Eye size={17} />
                                Activar marca
                              </>
                            )}
                          </button>
                        </form>

                        <div className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-500">
                          {hasRelations ? (
                            <span className="flex gap-3">
                              <ShieldAlert
                                size={18}
                                className="mt-0.5 shrink-0 text-amber-500"
                              />
                              Esta marca tiene datos asociados. Para eliminarla,
                              primero elimina o reasigna sus vehículos, modelos y
                              categorías.
                            </span>
                          ) : (
                            "Esta marca no tiene datos asociados. Puedes eliminarla si es necesario."
                          )}
                        </div>

                        <form action={deleteBrand} className="space-y-3">
                          <input
                            type="hidden"
                            name="brandId"
                            value={brand.id}
                          />

                          <input
                            name="confirmText"
                            placeholder="Escribe ELIMINAR"
                            disabled={hasRelations}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-red-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                          />

                          <button
                            type="submit"
                            disabled={hasRelations}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                            Eliminar marca
                          </button>
                        </form>
                      </div>
                    </aside>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white p-12 text-center">
            <Car size={54} className="mx-auto text-slate-400" />

            <h2 className="mt-5 text-2xl font-black text-[var(--rise-navy)]">
              Sin marcas registradas
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Crea la primera marca para comenzar a cargar catálogo, categorías
              e inventario.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-[var(--rise-navy)]">
            {value}
          </p>
        </div>

        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ title, value }: { title: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-xl font-black text-[var(--rise-navy)]">
        {value}
      </p>
    </div>
  );
}