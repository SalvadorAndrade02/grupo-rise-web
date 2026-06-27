import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
  Plus,
  Tags,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

function getBrandSlug(name: string) {
  const map: Record<string, string> = {
    "Can-Am": "can-am",
    Polaris: "polaris",
    "Royal Enfield": "royal-enfield",
    "Sea-Doo": "sea-doo",
    Triumph: "triumph-motorcycles",
    Indian: "indian-motorcycle",
    Zeekr: "zeekrlife",
    "Lynk & Co": "lynk-co",
  };

  return map[name] ?? name.toLowerCase().replace(/\s+/g, "-");
}

async function toggleCatalogModelActive(modelId: number, active: boolean) {
  "use server";

  const model = await prisma.catalogModel.update({
    where: {
      id: modelId,
    },
    data: {
      active,
    },
    include: {
      brand: true,
    },
  });

  revalidatePath("/admin/catalogo");
  revalidatePath(`/catalogo/${getBrandSlug(model.brand.name)}`);
  revalidatePath(`/catalogo/${getBrandSlug(model.brand.name)}/${model.slug}`);
}

export default async function AdminCatalogPage() {
  const models = await prisma.catalogModel.findMany({
    include: {
      brand: true,
      category: {
        include: {
          parent: true,
        },
      },
      images: {
        orderBy: {
          order: "asc",
        },
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

  const activeModels = models.filter((model) => model.active).length;
  const inactiveModels = models.filter((model) => !model.active).length;

  return (
      <section className="py-10">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Administración
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Catálogo de nuevos
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Administra modelos nuevos por marca, categoría, año, precio,
                imágenes y disponibilidad pública.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
              >
                Dashboard
              </Link>

              <Link
                href="/admin/catalogo/nuevo"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                <Plus size={18} />
                Nuevo modelo
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Total modelos</p>
              <p className="mt-2 text-4xl font-black">{models.length}</p>
            </div>

            <div className="rounded-[1.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Activos</p>
              <p className="mt-2 text-4xl font-black text-emerald-600">
                {activeModels}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Ocultos</p>
              <p className="mt-2 text-4xl font-black text-red-600">
                {inactiveModels}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            {models.map((model) => {
              const image = model.images[0]?.url || model.mainImage || "";
              const brandSlug = getBrandSlug(model.brand.name);

              return (
                <article
                  key={model.id}
                  className="grid gap-5 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm transition hover:shadow-lg hover:shadow-slate-900/10 lg:grid-cols-[260px_1fr_260px]"
                >
                  <div className="h-48 overflow-hidden rounded-2xl bg-slate-100 lg:h-full">
                    {image ? (
                      <img
                        src={image}
                        alt={model.name}
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
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--rise-blue)]">
                        {model.brand.name}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                          model.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {model.active ? "Activo" : "Oculto"}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-black">{model.name}</h2>

                    <p className="mt-2 text-sm font-bold text-slate-500">
                      {model.category?.parent?.name
                        ? `${model.category.parent.name} / ${model.category.name}`
                        : model.category?.name ?? "Sin categoría"}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Año
                        </p>
                        <p className="mt-1 font-black">
                          {model.year ?? "N/D"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Precio desde
                        </p>
                        <p className="mt-1 font-black text-[var(--rise-blue)]">
                          {model.priceFrom
                            ? formatCurrency(model.priceFrom)
                            : "Consultar"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Orden
                        </p>
                        <p className="mt-1 font-black">{model.sortOrder}</p>
                      </div>
                    </div>
                  </div>

                  <aside className="grid content-start gap-3">
                    {model.active ? (
                      <Link
                        href={`/catalogo/${brandSlug}/${model.slug}`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--rise-border)] bg-white px-4 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
                      >
                        <Eye size={17} />
                        Ver público
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-black text-slate-400"
                      >
                        <EyeOff size={17} />
                        Oculto
                      </button>
                    )}

                    <Link
                      href={`/admin/catalogo/${model.id}/editar`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-4 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                    >
                      <Pencil size={17} />
                      Editar
                    </Link>

                    <form
                      action={toggleCatalogModelActive.bind(
                        null,
                        model.id,
                        !model.active
                      )}
                    >
                      <button
                        type="submit"
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                          model.active
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {model.active ? (
                          <>
                            <EyeOff size={17} />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye size={17} />
                            Activar
                          </>
                        )}
                      </button>
                    </form>
                  </aside>
                </article>
              );
            })}

            {models.length === 0 && (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
                <Tags className="mx-auto text-slate-400" size={52} />

                <h2 className="mt-5 text-2xl font-black">
                  Aún no hay modelos en catálogo.
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Crea el primer modelo nuevo para mostrarlo en el catálogo
                  público.
                </p>

                <Link
                  href="/admin/catalogo/nuevo"
                  className="mt-5 inline-flex rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                >
                  Crear modelo
                </Link>
              </div>
            )}
          </div>
      </section>
  );
}