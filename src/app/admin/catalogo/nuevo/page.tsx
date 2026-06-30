import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ImageIcon,
  Layers3,
  Save,
  Sparkles,
  Tags,
} from "lucide-react";
import { VehicleCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { saveVehicleMediaFiles } from "@/lib/uploads";
import { BrandCategorySelects } from "@/components/admin/catalog/BrandCategorySelects";

export const dynamic = "force-dynamic";

type NewCatalogModelPageProps = {
  searchParams: Promise<{
    error?: string;
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

async function getUniqueCatalogSlug(brandId: number, name: string) {
  const baseSlug = slugify(name) || "modelo";
  let slug = baseSlug;
  let suffix = 2;

  while (
    await prisma.catalogModel.findUnique({
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

function getVehicleCategoryValue(value: FormDataEntryValue | null) {
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

async function createCatalogModel(formData: FormData) {
  "use server";

  const brandId = getNumberValue(formData, "brandId");
  const categoryId = getNumberValue(formData, "categoryId");

  const name = String(formData.get("name") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const specs = String(formData.get("specs") || "").trim();
  const features = String(formData.get("features") || "").trim();
  const mainImageInput = String(formData.get("mainImage") || "").trim();

  const categoryType = getVehicleCategoryValue(formData.get("categoryType"));

  const yearValue = String(formData.get("year") || "").trim();
  const priceFromValue = String(formData.get("priceFrom") || "").trim();
  const sortOrderValue = String(formData.get("sortOrder") || "").trim();

  const year = yearValue ? Number(yearValue) : null;
  const priceFrom = priceFromValue ? Number(priceFromValue) : null;
  const sortOrder = sortOrderValue ? Number(sortOrderValue) : 0;

  const active = formData.get("active") === "on";

  if (!brandId || !name) {
    redirect(
      `/admin/catalogo/nuevo?error=${encodeURIComponent(
        "Selecciona una marca y captura el nombre del modelo."
      )}`
    );
  }

  if (year !== null && (!Number.isFinite(year) || year < 1900)) {
    redirect(
      `/admin/catalogo/nuevo?error=${encodeURIComponent(
        "El año del modelo no es válido."
      )}`
    );
  }

  if (priceFrom !== null && (!Number.isFinite(priceFrom) || priceFrom < 0)) {
    redirect(
      `/admin/catalogo/nuevo?error=${encodeURIComponent(
        "El precio base no es válido."
      )}`
    );
  }

  const mediaFiles = formData
    .getAll("mediaFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  let savedMedia: Awaited<ReturnType<typeof saveVehicleMediaFiles>> = [];

  try {
    savedMedia = await saveVehicleMediaFiles(mediaFiles);
  } catch (error) {
    console.error(error);

    redirect(
      `/admin/catalogo/nuevo?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los archivos del modelo."
      )}`
    );
  }

  const firstImage = savedMedia.find((item) => item.type === "IMAGE");
  const finalMainImage = firstImage?.url || mainImageInput || null;
  const slug = await getUniqueCatalogSlug(brandId, name);

  await prisma.catalogModel.create({
    data: {
      brandId,
      categoryId: categoryId || null,
      name,
      slug,
      categoryType,
      year,
      priceFrom,
      subtitle,
      description,
      specs,
      features,
      mainImage: finalMainImage,
      active,
      sortOrder,

      images: savedMedia.length
        ? {
            create: savedMedia.map((item, index) => ({
              url: item.url,
              type: item.type,
              alt: name,
              order: index,
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/inventario/nuevo");
  revalidatePath("/catalogo");

  redirect("/admin/catalogo");
}

export default async function NewCatalogModelPage({
  searchParams,
}: NewCatalogModelPageProps) {
  const params = await searchParams;

  const [brands, catalogCategories] = await Promise.all([
    prisma.brand.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.catalogCategory.findMany({
      where: {
        active: true,
      },
      include: {
        parent: true,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
            Registrar modelo comercial
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Crea una plantilla de modelo por marca. Después podrás seleccionarla
            al registrar una unidad real en inventario.
          </p>
        </div>
      </div>

      {params.error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {params.error}
        </div>
      )}

      <form
        action={createCatalogModel}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"
      >
        <div className="space-y-6">
          <BrandCategorySelects
            mode="catalog"
            brands={brands.map((brand) => ({
              id: brand.id,
              name: brand.name,
              category: brand.category,
            }))}
            categories={catalogCategories.map((category) => ({
              id: category.id,
              brandId: category.brandId,
              name: category.name,
              parentId: category.parentId,
              parentName: category.parent?.name ?? null,
            }))}
          />

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                <Layers3 size={23} />
              </div>

              <div>
                <h2 className="text-2xl font-black">Datos del modelo</h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Información base del modelo comercial que se mostrará como
                  referencia para capturar unidades reales.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Nombre del modelo
                </span>

                <input
                  name="name"
                  required
                  placeholder="Ej. Defender HD11, Maverick R, Outlander MAX XT"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Subtítulo comercial
                </span>

                <input
                  name="subtitle"
                  placeholder="Ej. Side-by-side utilitario para trabajo y aventura"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Tipo
                </span>

                <select
                  name="categoryType"
                  defaultValue={VehicleCategory.TODOTERRENO}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="AUTO">Auto</option>
                  <option value="MOTO">Moto</option>
                  <option value="TODOTERRENO">Todo terreno</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Año modelo
                </span>

                <input
                  name="year"
                  type="number"
                  min={1900}
                  placeholder="2026"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Precio desde
                </span>

                <input
                  name="priceFrom"
                  type="number"
                  min={0}
                  placeholder="539900"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
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
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                <Tags size={23} />
              </div>

              <div>
                <h2 className="text-2xl font-black">Ficha comercial</h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Textos que ayudan a describir el modelo antes de crear una
                  unidad real.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Descripción
                </span>

                <textarea
                  name="description"
                  rows={5}
                  placeholder="Descripción comercial del modelo..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Especificaciones rápidas
                </span>

                <textarea
                  name="specs"
                  rows={3}
                  placeholder="Ej. Motor HD11, 95 hp, Tracción 4x4, Transmisión automática"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Características principales
                </span>

                <textarea
                  name="features"
                  rows={4}
                  placeholder="Ej. Cabina cómoda, suspensión reforzada, manejo todo terreno..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-5">
            <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/5 md:p-6">
              <h2 className="text-2xl font-black">Publicación</h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Controla si el modelo estará disponible como plantilla para
                registrar unidades reales.
              </p>

              <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="mt-1 h-5 w-5 rounded border-slate-300"
                />

                <span>
                  <span className="block text-sm font-black text-slate-700">
                    Modelo activo
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Si está activo, podrá seleccionarse al registrar unidades.
                  </span>
                </span>
              </label>

              <div className="mt-5 rounded-2xl bg-[var(--rise-blue-soft)] p-4">
                <Sparkles size={22} className="text-[var(--rise-blue)]" />

                <p className="mt-3 text-sm font-black text-[var(--rise-navy)]">
                  Flujo recomendado
                </p>

                <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
                  Primero crea el modelo base. Después registra la unidad real
                  desde inventario para que aparezca en el sitio público.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-black">Galería del modelo</h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Puedes subir imágenes comerciales o agregar una URL de imagen.
              </p>

              <label className="mt-5 block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Imagen principal externa
                </span>

                <input
                  name="mainImage"
                  placeholder="Opcional: URL de imagen"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Archivos
                </span>

                <input
                  name="mediaFiles"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--rise-navy)] file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-[var(--rise-blue)] focus:border-[var(--rise-blue)] focus:bg-white"
                />

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  JPG, PNG, WEBP, AVIF, MP4, WEBM o MOV.
                </p>
              </label>

              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-slate-400">
                <ImageIcon className="mx-auto" size={34} />
                <p className="mt-2 text-xs font-black uppercase tracking-wider">
                  Vista previa al guardar
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                <Save size={18} />
                Guardar modelo
              </button>

              <Link
                href="/admin/catalogo"
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
              >
                Cancelar
              </Link>
            </section>
          </div>
        </aside>
      </form>
    </div>
  );
}