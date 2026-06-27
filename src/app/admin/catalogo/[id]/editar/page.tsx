import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { VehicleCategory } from "@prisma/client";
import {
  ArrowLeft,
  Eye,
  ImageIcon,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { deletePublicFile, saveVehicleMediaFiles } from "@/lib/uploads";
import { BrandCategorySelects } from "@/components/admin/catalog/BrandCategorySelects";

export const dynamic = "force-dynamic";

type EditCatalogModelPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

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

function getValidCategoryType(value: FormDataEntryValue | null) {
  const categoryType = String(value ?? "TODOTERRENO");

  if (
    categoryType === VehicleCategory.AUTO ||
    categoryType === VehicleCategory.MOTO ||
    categoryType === VehicleCategory.TODOTERRENO
  ) {
    return categoryType;
  }

  return VehicleCategory.TODOTERRENO;
}

async function updateCatalogModel(modelId: number, formData: FormData) {
  "use server";

  const currentModel = await prisma.catalogModel.findUnique({
    where: {
      id: modelId,
    },
    include: {
      brand: true,
      images: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!currentModel) {
    throw new Error("No se encontró el modelo.");
  }

  const brandId = Number(formData.get("brandId"));
  const categoryId = Number(formData.get("categoryId"));
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const yearInput = String(formData.get("year") ?? "").trim();
  const priceFromInput = String(formData.get("priceFrom") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const specs = String(formData.get("specs") ?? "").trim();
  const features = String(formData.get("features") ?? "").trim();
  const mainImageInput = String(formData.get("mainImage") ?? "").trim();
  const sortOrderInput = String(formData.get("sortOrder") ?? "").trim();
  const active = formData.get("active") === "on";
  const categoryType = getValidCategoryType(formData.get("categoryType"));

  if (!brandId || !name) {
    throw new Error("Marca y nombre son obligatorios.");
  }

  const category =
    categoryId && !Number.isNaN(categoryId)
      ? await prisma.catalogCategory.findUnique({
        where: {
          id: categoryId,
        },
      })
      : null;

  if (categoryId && category && category.brandId !== brandId) {
    throw new Error("La categoría seleccionada no pertenece a la marca.");
  }

  const slug = slugInput ? slugify(slugInput) : slugify(name);

  const deleteMediaIds = formData
    .getAll("deleteMediaIds")
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));

  const mediaToDelete = currentModel.images.filter((image) =>
    deleteMediaIds.includes(image.id)
  );

  const remainingMedia = currentModel.images.filter(
    (image) => !deleteMediaIds.includes(image.id)
  );

  const mediaFiles = formData
    .getAll("mediaFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const savedMedia = await saveVehicleMediaFiles(mediaFiles);

  if (remainingMedia.length + savedMedia.length > 10) {
    throw new Error("El modelo no puede tener más de 10 archivos.");
  }

  const firstRemainingImage = remainingMedia.find(
    (image) => image.type === "IMAGE"
  );

  const firstUploadedImage = savedMedia.find((item) => item.type === "IMAGE");

  const finalMainImage =
    mainImageInput ||
    firstRemainingImage?.url ||
    firstUploadedImage?.url ||
    null;

  if (deleteMediaIds.length > 0) {
    await prisma.catalogImage.deleteMany({
      where: {
        catalogModelId: modelId,
        id: {
          in: deleteMediaIds,
        },
      },
    });
  }

  const updatedModel = await prisma.catalogModel.update({
    where: {
      id: modelId,
    },
    data: {
      brandId,
      categoryId: categoryId && !Number.isNaN(categoryId) ? categoryId : null,
      name,
      slug,
      categoryType,
      year: yearInput ? Number(yearInput) : null,
      priceFrom: priceFromInput ? Number(priceFromInput) : null,
      subtitle: subtitle || null,
      description,
      specs,
      features,
      mainImage: finalMainImage,
      active,
      sortOrder: sortOrderInput ? Number(sortOrderInput) : 0,
      images:
        savedMedia.length > 0
          ? {
            create: savedMedia.map((item, index) => ({
              url: item.url,
              type: item.type,
              alt: name,
              order: remainingMedia.length + index,
            })),
          }
          : undefined,
    },
    include: {
      brand: true,
    },
  });

  await Promise.all(mediaToDelete.map((image) => deletePublicFile(image.url)));

  const oldBrandSlug = getBrandSlug(currentModel.brand.name);
  const newBrandSlug = getBrandSlug(updatedModel.brand.name);

  revalidatePath("/admin/catalogo");
  revalidatePath(`/catalogo/${oldBrandSlug}`);
  revalidatePath(`/catalogo/${oldBrandSlug}/${currentModel.slug}`);
  revalidatePath(`/catalogo/${newBrandSlug}`);
  revalidatePath(`/catalogo/${newBrandSlug}/${updatedModel.slug}`);

  redirect("/admin/catalogo");
}

export default async function EditCatalogModelPage({
  params,
}: EditCatalogModelPageProps) {
  const { id } = await params;
  const modelId = Number(id);

  if (Number.isNaN(modelId)) {
    notFound();
  }

  const [catalogModel, brands, categories] = await Promise.all([
    prisma.catalogModel.findUnique({
      where: {
        id: modelId,
      },
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
    }),

    prisma.brand.findMany({
      orderBy: {
        name: "asc",
      },
    }),

    prisma.catalogCategory.findMany({
      where: {
        active: true,
        parentId: null,
      },
      include: {
        brand: true,
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

  if (!catalogModel) {
    notFound();
  }

  const brandSlug = getBrandSlug(catalogModel.brand.name);

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="py-10">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/admin/catalogo"
              className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[var(--rise-blue)]"
            >
              <ArrowLeft size={17} />
              Volver al catálogo
            </Link>

            {catalogModel.active && (
              <Link
                href={`/catalogo/${brandSlug}/${catalogModel.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--rise-border)] bg-white px-4 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
              >
                <Eye size={17} />
                Ver público
              </Link>
            )}
          </div>

          <div className="mt-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Catálogo
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Editar modelo
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Actualiza la información comercial, precio, categoría, imágenes y
              visibilidad pública del modelo.
            </p>
          </div>

          <form
            action={updateCatalogModel.bind(null, catalogModel.id)}
            className="mt-8 grid gap-6 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-8"
          >
            <section className="grid gap-5 md:grid-cols-2">
              <BrandCategorySelects
                brands={brands}
                categories={categories.map((category) => ({
                  id: category.id,
                  brandId: category.brandId,
                  name: category.name,
                  parentId: category.parentId,
                }))}
                defaultBrandId={catalogModel.brandId}
                defaultCategoryId={catalogModel.categoryId}
              />

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Nombre del modelo
                </span>

                <input
                  name="name"
                  required
                  defaultValue={catalogModel.name}
                  placeholder="Ej. Maverick R"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Slug
                </span>

                <input
                  name="slug"
                  defaultValue={catalogModel.slug}
                  placeholder="Ej. maverick-r"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Tipo general
                </span>

                <select
                  name="categoryType"
                  defaultValue={catalogModel.categoryType}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="AUTO">Auto</option>
                  <option value="MOTO">Moto</option>
                  <option value="TODOTERRENO">Todo terreno</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Año
                </span>

                <input
                  name="year"
                  type="number"
                  defaultValue={catalogModel.year ?? ""}
                  placeholder="2026"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Precio desde
                </span>

                <input
                  name="priceFrom"
                  type="number"
                  defaultValue={catalogModel.priceFrom ?? ""}
                  placeholder="899900"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Orden
                </span>

                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={catalogModel.sortOrder}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>
            </section>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Subtítulo
              </span>

              <input
                name="subtitle"
                defaultValue={catalogModel.subtitle ?? ""}
                placeholder="Descripción corta para cards"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                URL imagen principal
              </span>

              <input
                name="mainImage"
                defaultValue={catalogModel.mainImage ?? ""}
                placeholder="/uploads/vehicles/imagen.jpg"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Descripción
              </span>

              <textarea
                name="description"
                rows={5}
                defaultValue={catalogModel.description}
                placeholder="Descripción comercial del modelo..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              />
            </label>

            <section className="grid gap-5 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Características
                </span>

                <textarea
                  name="features"
                  rows={5}
                  defaultValue={catalogModel.features}
                  placeholder="Separadas por coma. Ej: Motor Rotax, Suspensión FOX, Modos de manejo"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Especificaciones
                </span>

                <textarea
                  name="specs"
                  rows={5}
                  defaultValue={catalogModel.specs}
                  placeholder="Separadas por coma. Ej: 999 cc, 2 pasajeros, transmisión automática"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>
            </section>

            <section className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                    Galería actual
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Imágenes y videos
                  </h2>
                </div>

                <p className="text-sm font-bold text-slate-500">
                  {catalogModel.images.length} archivo(s)
                </p>
              </div>

              {catalogModel.images.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {catalogModel.images.map((media) => (
                    <label
                      key={media.id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <div className="h-36 bg-slate-100">
                        {media.type === "VIDEO" ? (
                          <video
                            src={media.url}
                            className="h-full w-full object-cover"
                            controls
                          />
                        ) : (
                          <img
                            src={media.url}
                            alt={media.alt ?? catalogModel.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-3 p-4">
                        <input
                          type="checkbox"
                          name="deleteMediaIds"
                          value={media.id}
                          className="h-5 w-5 rounded border-slate-300"
                        />

                        <span className="inline-flex items-center gap-2 text-sm font-black text-red-600">
                          <Trash2 size={16} />
                          Eliminar
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <ImageIcon className="mx-auto text-slate-400" size={46} />

                  <p className="mt-3 text-sm font-black text-slate-500">
                    Este modelo todavía no tiene archivos.
                  </p>
                </div>
              )}
            </section>

            <label>
              <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                <UploadCloud size={17} />
                Agregar nuevas imágenes / videos
              </span>

              <input
                name="mediaFiles"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500"
              />
            </label>

            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <input
                name="active"
                type="checkbox"
                defaultChecked={catalogModel.active}
                className="h-5 w-5 rounded border-slate-300"
              />

              <span className="text-sm font-black text-slate-600">
                Mostrar modelo en catálogo público
              </span>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-6 py-4 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                <Save size={18} />
                Guardar cambios
              </button>

              <Link
                href="/admin/catalogo"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-6 py-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </Container>
      </section>

      <Footer />
    </main>
  );
}