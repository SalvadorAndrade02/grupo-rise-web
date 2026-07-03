import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  BadgeCheck,
  Car,
  Eye,
  EyeOff,
  Plus,
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

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/catalogo/nuevo");
  revalidatePath("/admin/catalogo/categorias");
  revalidatePath("/admin/inventario/nuevo");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");

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

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/catalogo/nuevo");
  revalidatePath("/admin/catalogo/categorias");
  revalidatePath("/admin/inventario/nuevo");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");

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

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/inventario");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
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

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/catalogo/nuevo");
  revalidatePath("/admin/catalogo/categorias");
  revalidatePath("/admin/inventario/nuevo");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");

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
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Administración
            </p>

            <h1 className="mt-3 text-3xl font-black text-[var(--rise-navy)] md:text-4xl">
              Marcas
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Crea y administra las marcas que se usan en catálogo base,
              inventario, vehículos y páginas públicas.
            </p>
          </div>

          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
            <Tags size={28} />
          </div>
        </div>

        {params.error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {params.error}
          </div>
        )}

        {params.success && (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {params.success}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Marcas" value={totalBrands} icon={<Tags />} />
        <MetricCard title="Activas" value={activeBrands} icon={<Eye />} />
        <MetricCard title="Ocultas" value={hiddenBrands} icon={<EyeOff />} />
        <MetricCard
          title="Con catálogo"
          value={brandsWithCatalog}
          icon={<BadgeCheck />}
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-[var(--rise-navy)]">
                Nueva marca
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Agrega una marca para usarla en categorías, modelos base e
                inventario.
              </p>
            </div>

            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
              <Plus size={24} />
            </div>
          </div>

          <form action={createBrand} className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">
                Nombre de marca
              </span>

              <input
                name="name"
                required
                placeholder="Ej. Can-Am, Polaris, Zeekr"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">
                Tipo comercial
              </span>

              <select
                name="category"
                defaultValue={VehicleCategory.TODOTERRENO}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              >
                <option value={VehicleCategory.TODOTERRENO}>
                  Todo terreno
                </option>
                <option value={VehicleCategory.MOTO}>Moto</option>
                <option value={VehicleCategory.AUTO}>Auto</option>
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <input
                name="active"
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-slate-300"
              />

              <span className="text-sm font-black text-slate-700">
                Marca activa / visible
              </span>
            </label>

            <button
              type="submit"
              className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
            >
              <Plus size={18} />
              Crear marca
            </button>
          </form>
        </aside>

        <section className="space-y-5">
          {brands.length > 0 ? (
            brands.map((brand) => {
              const hasRelations =
                brand._count.vehicles > 0 ||
                brand._count.catalogModels > 0 ||
                brand._count.catalogCategories > 0;

              return (
                <article
                  key={brand.id}
                  className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm"
                >
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <form
                      action={updateBrand.bind(null, brand.id)}
                      className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_160px]"
                    >
                      <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                          Marca
                        </span>

                        <input
                          name="name"
                          defaultValue={brand.name}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-[var(--rise-navy)] outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                          Tipo
                        </span>

                        <select
                          name="category"
                          defaultValue={brand.category}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-[var(--rise-navy)] outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                        >
                          <option value={VehicleCategory.TODOTERRENO}>
                            Todo terreno
                          </option>
                          <option value={VehicleCategory.MOTO}>Moto</option>
                          <option value={VehicleCategory.AUTO}>Auto</option>
                        </select>
                      </label>

                      <div>
                        <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                          Estado
                        </span>

                        <label className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                          <input
                            name="active"
                            type="checkbox"
                            defaultChecked={brand.active}
                            className="h-5 w-5 rounded border-slate-300"
                          />

                          <span className="text-sm font-black text-slate-700">
                            Activa
                          </span>
                        </label>
                      </div>

                      <div className="md:col-span-3">
                        <button
                          type="submit"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 text-xs font-black text-white transition hover:bg-[var(--rise-blue)]"
                        >
                          Guardar cambios
                        </button>
                      </div>
                    </form>

                    <div className="space-y-3 rounded-[1.5rem] bg-slate-50 p-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
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

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${brand.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-200 text-slate-500"
                            }`}
                        >
                          {brand.active ? "Activa" : "Oculta"}
                        </span>

                        <span className="inline-flex rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black text-[var(--rise-blue)]">
                          {getCategoryLabel(brand.category)}
                        </span>
                      </div>

                      <form action={toggleBrandActive.bind(null, brand.id)}>
                        <button
                          type="submit"
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                        >
                          {brand.active ? (
                            <>
                              <EyeOff size={15} />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <Eye size={15} />
                              Activar
                            </>
                          )}
                        </button>
                      </form>

                      <form action={deleteBrand} className="space-y-2">
                        <input
                          type="hidden"
                          name="brandId"
                          value={brand.id}
                        />

                        <input
                          name="confirmText"
                          placeholder="Escribe ELIMINAR"
                          disabled={hasRelations}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none transition focus:border-red-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />

                        <button
                          type="submit"
                          disabled={hasRelations}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          Eliminar
                        </button>

                        {hasRelations && (
                          <p className="flex gap-2 text-xs leading-5 text-slate-500">
                            <ShieldAlert
                              size={15}
                              className="mt-0.5 shrink-0 text-amber-500"
                            />
                            No se puede eliminar porque tiene datos asociados.
                          </p>
                        )}
                      </form>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
              <Car size={48} className="mx-auto text-slate-400" />

              <h2 className="mt-4 text-2xl font-black text-[var(--rise-navy)]">
                Sin marcas registradas
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Crea la primera marca para comenzar a cargar catálogo e
                inventario.
              </p>
            </div>
          )}
        </section>
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
  icon: React.ReactNode;
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

      <p className="mt-1 text-lg font-black text-[var(--rise-navy)]">
        {value}
      </p>
    </div>
  );
}