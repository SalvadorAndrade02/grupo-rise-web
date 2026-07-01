import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ImageIcon,
  Plus,
  Save,
  Star,
  Tags,
  Trash2,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleMediaType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  deletePublicFile,
  saveVehicleMediaFiles,
} from "@/lib/uploads";
import { BrandCategorySelects } from "@/components/admin/catalog/BrandCategorySelects";

export const dynamic = "force-dynamic";

type EditCatalogModelPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function getStringValue(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) || "").trim();
}

function getOptionalNumberValue(formData: FormData, fieldName: string) {
  const rawValue = String(formData.get(fieldName) ?? "").trim();

  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);

  return Number.isFinite(value) ? value : null;
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

async function getUniqueCatalogSlug(
  brandId: number,
  name: string,
  currentModelId: number
) {
  const baseSlug = slugify(name) || "modelo";
  let slug = baseSlug;
  let suffix = 2;

  while (
    await prisma.catalogModel.findFirst({
      where: {
        brandId,
        slug,
        NOT: {
          id: currentModelId,
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

async function updateCatalogModel(formData: FormData) {
  "use server";

  const modelId = Number(formData.get("modelId"));

  if (!modelId) {
    redirect("/admin/catalogo?error=Modelo no válido");
  }

  const currentModel = await prisma.catalogModel.findUnique({
    where: {
      id: modelId,
    },
    include: {
      images: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!currentModel) {
    redirect("/admin/catalogo?error=El modelo ya no existe");
  }

  const brandId = Number(formData.get("brandId"));
  const categoryId = getOptionalNumberValue(formData, "categoryId");

  const name = getStringValue(formData, "name");
  const subtitle = getStringValue(formData, "subtitle");
  const description = getStringValue(formData, "description");
  const specs = getStringValue(formData, "specs");
  const features = getStringValue(formData, "features");

  const year = getOptionalNumberValue(formData, "year");
  const priceFrom = getOptionalNumberValue(formData, "priceFrom");
  const sortOrder = getOptionalNumberValue(formData, "sortOrder") ?? 0;

  const categoryType = getVehicleCategoryValue(formData.get("categoryType"));
  const active = formData.get("active") === "on";

  const mainImageUrl = getStringValue(formData, "mainImageUrl");
  const mainImageSelection = getStringValue(formData, "mainImageSelection");

  if (!brandId || !name) {
    redirect(
      `/admin/catalogo/${modelId}/editar?error=${encodeURIComponent(
        "Selecciona una marca y captura el nombre del modelo."
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
      `/admin/catalogo/${modelId}/editar?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar las imágenes."
      )}`
    );
  }

  const currentHighestOrder = currentModel.images.reduce((highest, image) => {
    return image.order > highest ? image.order : highest;
  }, -1);

  const firstUploadedImage = savedMedia.find(
    (item) => item.type === VehicleMediaType.IMAGE
  );

  const firstExistingImage = currentModel.images.find(
    (item) => item.type === VehicleMediaType.IMAGE
  );

  const finalMainImage =
    mainImageSelection ||
    mainImageUrl ||
    currentModel.mainImage ||
    firstExistingImage?.url ||
    firstUploadedImage?.url ||
    "";

  const slug = await getUniqueCatalogSlug(brandId, name, modelId);

  await prisma.catalogModel.update({
    where: {
      id: modelId,
    },
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
            order: currentHighestOrder + index + 1,
          })),
        }
        : undefined,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/catalogo");
  revalidatePath(`/admin/catalogo/${modelId}/editar`);
  revalidatePath("/admin/inventario/nuevo");
  revalidatePath("/catalogo");

  redirect(
    `/admin/catalogo/${modelId}/editar?success=${encodeURIComponent(
      "Modelo actualizado correctamente."
    )}`
  );
}

async function setCatalogMainImage(modelId: number, imageId: number) {
  "use server";

  if (!modelId || !imageId) {
    return;
  }

  const image = await prisma.catalogImage.findUnique({
    where: {
      id: imageId,
    },
  });

  if (!image || image.catalogModelId !== modelId) {
    redirect(
      `/admin/catalogo/${modelId}/editar?error=${encodeURIComponent(
        "No se pudo identificar la imagen."
      )}`
    );
  }

  await prisma.$transaction([
    prisma.catalogModel.update({
      where: {
        id: modelId,
      },
      data: {
        mainImage: image.url,
      },
    }),

    prisma.catalogImage.updateMany({
      where: {
        catalogModelId: modelId,
      },
      data: {
        order: 1,
      },
    }),

    prisma.catalogImage.update({
      where: {
        id: imageId,
      },
      data: {
        order: 0,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/catalogo");
  revalidatePath(`/admin/catalogo/${modelId}/editar`);
  revalidatePath("/admin/inventario/nuevo");
  revalidatePath("/catalogo");

  redirect(
    `/admin/catalogo/${modelId}/editar?success=${encodeURIComponent(
      "Imagen principal actualizada."
    )}`
  );
}

async function deleteCatalogImage(modelId: number, imageId: number) {
  "use server";

  if (!modelId || !imageId) {
    return;
  }

  const image = await prisma.catalogImage.findUnique({
    where: {
      id: imageId,
    },
    include: {
      catalogModel: {
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  });

  if (!image || image.catalogModelId !== modelId) {
    redirect(
      `/admin/catalogo/${modelId}/editar?error=${encodeURIComponent(
        "No se pudo identificar la imagen."
      )}`
    );
  }

  const remainingImages = image.catalogModel.images.filter(
    (item) => item.id !== image.id
  );

  await prisma.catalogImage.delete({
    where: {
      id: imageId,
    },
  });

  if (image.catalogModel.mainImage === image.url) {
    const nextMainImage =
      remainingImages.find((item) => item.type === VehicleMediaType.IMAGE)
        ?.url ?? "";

    await prisma.catalogModel.update({
      where: {
        id: modelId,
      },
      data: {
        mainImage: nextMainImage,
      },
    });
  }

  if (image.url.startsWith("/uploads/")) {
    try {
      await deletePublicFile(image.url);
    } catch (error) {
      console.error(error);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/catalogo");
  revalidatePath(`/admin/catalogo/${modelId}/editar`);
  revalidatePath("/admin/inventario/nuevo");
  revalidatePath("/catalogo");

  redirect(
    `/admin/catalogo/${modelId}/editar?success=${encodeURIComponent(
      "Imagen eliminada correctamente."
    )}`
  );
}

function getCategoryTypeLabel(category: VehicleCategory) {
  const labels: Record<VehicleCategory, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category];
}

export default async function EditCatalogModelPage({
  params,
  searchParams,
}: EditCatalogModelPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const modelId = Number(id);

  if (!modelId) {
    notFound();
  }

  const [catalogModel, brands, catalogCategories] = await Promise.all([
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

  if (!catalogModel) {
    notFound();
  }

  const mainImage =
    catalogModel.mainImage ||
    catalogModel.images.find((image) => image.type === VehicleMediaType.IMAGE)
      ?.url ||
    "";

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
            Editar modelo base
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            {catalogModel.brand.name} {catalogModel.name}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Actualiza la información comercial del modelo. Estos datos se usan
            como plantilla al crear unidades reales en inventario.
          </p>
        </div>

        <Link
          href="/admin/inventario/nuevo"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
        >
          <Plus size={18} />
          Crear unidad
        </Link>
      </div>

      {query.error && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {query.error}
        </div>
      )}

      {query.success && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {query.success}
        </div>
      )}

      <form action={updateCatalogModel} className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <input type="hidden" name="modelId" value={catalogModel.id} />

        <div className="grid gap-6">
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
            defaultBrandId={catalogModel.brandId}
            defaultCategoryId={catalogModel.categoryId}
          />

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Información del modelo
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Datos comerciales
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Nombre del modelo
                </span>

                <input
                  name="name"
                  required
                  defaultValue={catalogModel.name}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Subtítulo comercial
                </span>

                <input
                  name="subtitle"
                  defaultValue={catalogModel.subtitle ?? ""}
                  placeholder="Ej. Side-by-side deportivo para aventura extrema"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Tipo
                </span>

                <select
                  name="categoryType"
                  defaultValue={catalogModel.categoryType}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  {Object.values(VehicleCategory).map((category) => (
                    <option key={category} value={category}>
                      {getCategoryTypeLabel(category)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Año modelo
                </span>

                <input
                  name="year"
                  type="number"
                  defaultValue={catalogModel.year ?? ""}
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
                  defaultValue={catalogModel.priceFrom ?? ""}
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
                  defaultValue={catalogModel.sortOrder}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Ficha comercial
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Textos del modelo
            </h2>

            <div className="mt-6 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Descripción
                </span>

                <textarea
                  name="description"
                  rows={5}
                  defaultValue={catalogModel.description ?? ""}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Especificaciones rápidas
                </span>

                <textarea
                  name="specs"
                  rows={4}
                  defaultValue={catalogModel.specs ?? ""}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Características principales
                </span>

                <textarea
                  name="features"
                  rows={4}
                  defaultValue={catalogModel.features ?? ""}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="grid gap-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/5 md:p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Publicación
            </p>

            <div className="mt-5 grid gap-4">
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={catalogModel.active}
                  className="mt-1 h-5 w-5 rounded border-slate-300"
                />

                <span>
                  <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                    {catalogModel.active ? <Eye size={16} /> : <EyeOff size={16} />}
                    Modelo activo
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Si está activo, aparecerá disponible para crear unidades.
                  </span>
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                <Save size={18} />
                Guardar cambios
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Imagen principal
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={catalogModel.name}
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-56 items-center justify-center">
                  <ImageIcon size={42} className="text-slate-400" />
                </div>
              )}
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                URL manual de imagen principal
              </span>

              <input
                name="mainImageUrl"
                defaultValue={catalogModel.mainImage ?? ""}
                placeholder="/uploads/vehicles/imagen.webp"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Agregar imágenes o video
              </span>

              <input
                name="mediaFiles"
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm,video/quicktime"
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--rise-navy)] file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
              />

              <p className="mt-2 text-xs text-slate-500">
                Las nuevas imágenes se agregan a la galería actual; no borran
                las anteriores.
              </p>
            </label>
          </section>

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Galería
                </p>

                <h2 className="mt-2 text-xl font-black">
                  Imágenes actuales
                </h2>
              </div>

              <Tags size={22} className="text-slate-400" />
            </div>

            <div className="mt-5 grid gap-4">
              {catalogModel.images.length > 0 ? (
                catalogModel.images.map((image) => {
                  const isMain = catalogModel.mainImage === image.url;

                  return (
                    <article
                      key={image.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                    >
                      <div className="relative">
                        {image.type === VehicleMediaType.IMAGE ? (
                          <img
                            src={image.url}
                            alt={image.alt ?? catalogModel.name}
                            className="h-40 w-full object-cover"
                          />
                        ) : (
                          <video
                            src={image.url}
                            controls
                            className="h-40 w-full bg-black object-cover"
                          />
                        )}

                        {isMain && (
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-amber-600 shadow-sm">
                            <Star size={14} />
                            Principal
                          </span>
                        )}
                      </div>

                      <div className="grid gap-2 p-3">
                        <button
                          type="submit"
                          formAction={setCatalogMainImage.bind(null, catalogModel.id, image.id)}
                          formNoValidate
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                        >
                          <Star size={15} />
                          Usar como principal
                        </button>

                        <button
                          type="submit"
                          formAction={deleteCatalogImage.bind(null, catalogModel.id, image.id)}
                          formNoValidate
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-xs font-black text-red-700 transition hover:bg-red-100"
                        >
                          <Trash2 size={15} />
                          Eliminar imagen
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <ImageIcon size={40} className="mx-auto text-slate-400" />

                  <p className="mt-3 text-sm font-black text-slate-600">
                    Este modelo no tiene galería.
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Agrega imágenes desde el campo superior.
                  </p>
                </div>
              )}
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}