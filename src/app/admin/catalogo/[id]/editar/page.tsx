import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  ImageIcon,
  Layers3,
  Plus,
  Save,
  Star,
  Tags,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleMediaType,
} from "@prisma/client";
import {
  AdminAlert,
  AdminHero,
  AdminInput,
  AdminSection,
  AdminSelect,
  AdminSummaryCard,
  AdminTextarea,
  AdminToggleOption,
} from "@/components/admin/ui";
import { BrandCategorySelects } from "@/components/admin/catalog/BrandCategorySelects";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  deletePublicFile,
  saveVehicleMediaFiles,
} from "@/lib/uploads";

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

function getTextValue(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) ?? ""
  ).trim();
}

function getPositiveIntegerValue(
  formData: FormData,
  fieldName: string
) {
  const value = Number(
    formData.get(fieldName)
  );

  return Number.isInteger(value) &&
    value > 0
    ? value
    : 0;
}

function getOptionalNumberValue(
  formData: FormData,
  fieldName: string
) {
  const rawValue = getTextValue(
    formData,
    fieldName
  );

  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);

  return Number.isFinite(value)
    ? value
    : null;
}

function getSortOrderValue(
  formData: FormData
) {
  const rawValue = getTextValue(
    formData,
    "sortOrder"
  );

  if (!rawValue) {
    return 0;
  }

  const value = Number(rawValue);

  return Number.isInteger(value)
    ? value
    : Number.NaN;
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
  const baseSlug =
    slugify(name) || "modelo";

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

      select: {
        id: true,
      },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function getVehicleCategoryValue(
  value: FormDataEntryValue | null
) {
  const categoryValue = String(
    value ||
    VehicleCategory.TODOTERRENO
  );

  const validCategories: VehicleCategory[] =
    [
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

function getCategoryTypeLabel(
  category: VehicleCategory
) {
  const labels: Record<
    VehicleCategory,
    string
  > = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
    NAUTICA: "Náutica",
  };

  return labels[category];
}

function isValidImageReference(
  value: string
) {
  if (!value) {
    return true;
  }

  if (value.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function redirectCatalogError(
  modelId: number,
  message: string
): never {
  redirect(
    `/admin/catalogo/${modelId}/editar?error=${encodeURIComponent(
      message
    )}`
  );
}

function revalidateCatalogPaths(
  modelId: number
) {
  revalidatePath("/admin");
  revalidatePath("/admin/catalogo");

  revalidatePath(
    `/admin/catalogo/${modelId}/editar`
  );

  revalidatePath(
    "/admin/inventario/nuevo"
  );

  revalidatePath("/catalogo");
  revalidatePath("/inventario");
}

async function safelyDeleteMedia(
  media: {
    url: string;
  }[]
) {
  await Promise.allSettled(
    media.map(async (item) => {
      if (
        !item.url.startsWith("/uploads/")
      ) {
        return;
      }

      try {
        await deletePublicFile(item.url);
      } catch (error) {
        console.error(
          `No se pudo eliminar ${item.url}:`,
          error
        );
      }
    })
  );
}

async function safelyDeleteFile(
  url?: string | null
) {
  if (
    !url ||
    !url.startsWith("/uploads/")
  ) {
    return;
  }

  try {
    await deletePublicFile(url);
  } catch (error) {
    console.error(
      `No se pudo eliminar ${url}:`,
      error
    );
  }
}

async function updateCatalogModel(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const modelId =
    getPositiveIntegerValue(
      formData,
      "modelId"
    );

  if (!modelId) {
    redirect(
      `/admin/catalogo?error=${encodeURIComponent(
        "El modelo no es válido."
      )}`
    );
  }

  const currentModel =
    await prisma.catalogModel.findUnique({
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
    redirect(
      `/admin/catalogo?error=${encodeURIComponent(
        "El modelo ya no existe."
      )}`
    );
  }

  const brandId =
    getPositiveIntegerValue(
      formData,
      "brandId"
    );

  const selectedCategoryId =
    getPositiveIntegerValue(
      formData,
      "categoryId"
    );

  const categoryId =
    selectedCategoryId || null;

  const name = getTextValue(
    formData,
    "name"
  );

  const subtitle = getTextValue(
    formData,
    "subtitle"
  );

  const description = getTextValue(
    formData,
    "description"
  );

  const specs = getTextValue(
    formData,
    "specs"
  );

  const features = getTextValue(
    formData,
    "features"
  );

  const mainImageUrl = getTextValue(
    formData,
    "mainImageUrl"
  );

  const year =
    getOptionalNumberValue(
      formData,
      "year"
    );

  const priceFrom =
    getOptionalNumberValue(
      formData,
      "priceFrom"
    );

  const sortOrder =
    getSortOrderValue(formData);

  const categoryType =
    getVehicleCategoryValue(
      formData.get("categoryType")
    );

  const active =
    formData.get("active") === "on";

  if (!brandId || !name) {
    redirectCatalogError(
      modelId,
      "Selecciona una marca y captura el nombre del modelo."
    );
  }

  if (name.length < 2) {
    redirectCatalogError(
      modelId,
      "El nombre debe contener al menos dos caracteres."
    );
  }

  if (
    year !== null &&
    (!Number.isInteger(year) ||
      year < 1900 ||
      year >
      new Date().getFullYear() + 3)
  ) {
    redirectCatalogError(
      modelId,
      "El año del modelo no es válido."
    );
  }

  if (
    priceFrom !== null &&
    priceFrom < 0
  ) {
    redirectCatalogError(
      modelId,
      "El precio base no es válido."
    );
  }

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    redirectCatalogError(
      modelId,
      "El orden debe ser un número entero igual o mayor a cero."
    );
  }

  if (
    !isValidImageReference(
      mainImageUrl
    )
  ) {
    redirectCatalogError(
      modelId,
      "La referencia de la imagen principal no es válida."
    );
  }

  const [brand, category] =
    await Promise.all([
      prisma.brand.findUnique({
        where: {
          id: brandId,
        },

        select: {
          id: true,
          active: true,
          category: true,
        },
      }),

      categoryId
        ? prisma.catalogCategory.findUnique(
          {
            where: {
              id: categoryId,
            },

            select: {
              id: true,
              active: true,
              brandId: true,
            },
          }
        )
        : Promise.resolve(null),
    ]);

  if (
    !brand ||
    (!brand.active &&
      brand.id !==
      currentModel.brandId)
  ) {
    redirectCatalogError(
      modelId,
      "La marca seleccionada no existe o está inactiva."
    );
  }

  if (
    brand.category !== categoryType
  ) {
    redirectCatalogError(
      modelId,
      "El tipo seleccionado no corresponde con la clasificación de la marca."
    );
  }

  if (
    categoryId &&
    (!category ||
      category.brandId !== brandId ||
      (!category.active &&
        category.id !==
        currentModel.categoryId))
  ) {
    redirectCatalogError(
      modelId,
      "La categoría seleccionada no corresponde con la marca."
    );
  }

  const mediaFiles = formData
    .getAll("mediaFiles")
    .filter(
      (value): value is File =>
        value instanceof File &&
        value.size > 0
    );

  let savedMedia: Awaited<
    ReturnType<
      typeof saveVehicleMediaFiles
    >
  > = [];

  try {
    savedMedia =
      await saveVehicleMediaFiles(
        mediaFiles
      );
  } catch (error) {
    console.error(
      "Error guardando archivos:",
      error
    );

    redirectCatalogError(
      modelId,
      error instanceof Error
        ? error.message
        : "No se pudieron guardar los archivos."
    );
  }

  const highestOrder =
    currentModel.images.reduce(
      (highest, image) =>
        Math.max(
          highest,
          image.order
        ),
      -1
    );

  const firstExistingImage =
    currentModel.images.find(
      (image) =>
        image.type ===
        VehicleMediaType.IMAGE
    );

  const firstUploadedImage =
    savedMedia.find(
      (item) =>
        item.type ===
        VehicleMediaType.IMAGE
    );

  const finalMainImage =
    mainImageUrl ||
    currentModel.mainImage ||
    firstExistingImage?.url ||
    firstUploadedImage?.url ||
    "";

  const slug =
    await getUniqueCatalogSlug(
      brandId,
      name,
      modelId
    );

  try {
    await prisma.catalogModel.update({
      where: {
        id: modelId,
      },

      data: {
        brandId,
        categoryId,
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
            create: savedMedia.map(
              (item, index) => ({
                url: item.url,
                type: item.type,
                alt: name,

                order:
                  highestOrder +
                  index +
                  1,
              })
            ),
          }
          : undefined,
      },
    });
  } catch (error) {
    await safelyDeleteMedia(savedMedia);

    console.error(
      "Error actualizando modelo:",
      error
    );

    redirectCatalogError(
      modelId,
      "No se pudieron guardar los cambios del modelo."
    );
  }

  revalidateCatalogPaths(modelId);

  redirect(
    `/admin/catalogo/${modelId}/editar?success=${encodeURIComponent(
      "Modelo actualizado correctamente."
    )}`
  );
}

async function setCatalogMainImage(
  modelId: number,
  imageId: number
) {
  "use server";

  await requireAdmin();

  if (
    !Number.isInteger(modelId) ||
    modelId <= 0 ||
    !Number.isInteger(imageId) ||
    imageId <= 0
  ) {
    return;
  }

  const image =
    await prisma.catalogImage.findUnique({
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

  if (
    !image ||
    image.catalogModelId !== modelId
  ) {
    redirectCatalogError(
      modelId,
      "No se pudo identificar la imagen."
    );
  }

  if (
    image.type !==
    VehicleMediaType.IMAGE
  ) {
    redirectCatalogError(
      modelId,
      "Un video no puede utilizarse como imagen principal."
    );
  }

  const orderedImages = [
    image,
    ...image.catalogModel.images.filter(
      (item) => item.id !== image.id
    ),
  ];

  await prisma.$transaction([
    prisma.catalogModel.update({
      where: {
        id: modelId,
      },

      data: {
        mainImage: image.url,
      },
    }),

    ...orderedImages.map(
      (item, index) =>
        prisma.catalogImage.update({
          where: {
            id: item.id,
          },

          data: {
            order: index,
          },
        })
    ),
  ]);

  revalidateCatalogPaths(modelId);

  redirect(
    `/admin/catalogo/${modelId}/editar?success=${encodeURIComponent(
      "Imagen principal actualizada."
    )}`
  );
}

async function deleteCatalogImage(
  modelId: number,
  imageId: number
) {
  "use server";

  await requireAdmin();

  if (
    !Number.isInteger(modelId) ||
    modelId <= 0 ||
    !Number.isInteger(imageId) ||
    imageId <= 0
  ) {
    return;
  }

  const image =
    await prisma.catalogImage.findUnique({
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

  if (
    !image ||
    image.catalogModelId !== modelId
  ) {
    redirectCatalogError(
      modelId,
      "No se pudo identificar el archivo."
    );
  }

  const remainingImages =
    image.catalogModel.images.filter(
      (item) => item.id !== image.id
    );

  const wasMainImage =
    image.catalogModel.mainImage ===
    image.url;

  const nextMainImage = wasMainImage
    ? remainingImages.find(
      (item) =>
        item.type ===
        VehicleMediaType.IMAGE
    )?.url ?? ""
    : image.catalogModel.mainImage;

  await prisma.$transaction([
    prisma.catalogImage.delete({
      where: {
        id: imageId,
      },
    }),

    prisma.catalogModel.update({
      where: {
        id: modelId,
      },

      data: {
        mainImage: nextMainImage,
      },
    }),

    ...remainingImages.map(
      (item, index) =>
        prisma.catalogImage.update({
          where: {
            id: item.id,
          },

          data: {
            order: index,
          },
        })
    ),
  ]);

  await safelyDeleteFile(image.url);

  revalidateCatalogPaths(modelId);

  redirect(
    `/admin/catalogo/${modelId}/editar?success=${encodeURIComponent(
      "Archivo eliminado correctamente."
    )}`
  );
}

export default async function EditCatalogModelPage({
  params,
  searchParams,
}: EditCatalogModelPageProps) {
  await requireAdmin();

  const { id } = await params;
  const query = await searchParams;

  const modelId = Number(id);

  if (
    !Number.isInteger(modelId) ||
    modelId <= 0
  ) {
    notFound();
  }

  const catalogModel =
    await prisma.catalogModel.findUnique({
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
    });

  if (!catalogModel) {
    notFound();
  }

  const [brands, catalogCategories] =
    await Promise.all([
      prisma.brand.findMany({
        where: {
          OR: [
            {
              active: true,
            },
            {
              id: catalogModel.brandId,
            },
          ],
        },

        orderBy: {
          name: "asc",
        },
      }),

      prisma.catalogCategory.findMany({
        where: {
          OR: [
            {
              active: true,
            },

            ...(catalogModel.categoryId
              ? [
                {
                  id: catalogModel.categoryId,
                },
              ]
              : []),
          ],
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

  const mainImage =
    catalogModel.mainImage ||
    catalogModel.images.find(
      (image) =>
        image.type ===
        VehicleMediaType.IMAGE
    )?.url ||
    "";

  const imageCount =
    catalogModel.images.filter(
      (image) =>
        image.type ===
        VehicleMediaType.IMAGE
    ).length;

  const videoCount =
    catalogModel.images.filter(
      (image) =>
        image.type !==
        VehicleMediaType.IMAGE
    ).length;

  const categoryName =
    catalogModel.category?.name ??
    "Sin categoría";

  return (
    <div className="pb-10">
      <AdminHero
        eyebrow={`Modelo #${catalogModel.id}`}
        title={`${catalogModel.brand.name} ${catalogModel.name}`}
        description="Actualiza la información comercial, publicación y galería utilizada como plantilla al crear unidades reales."
        icon={Layers3}
        backHref="/admin/catalogo"
        backLabel="Volver al catálogo base"
        actions={
          <Link
            href="/admin/inventario/nuevo"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
          >
            <Plus size={17} />
            Crear unidad
          </Link>
        }
      />

      {query.error && (
        <AdminAlert
          variant="error"
          className="mt-5"
        >
          {query.error}
        </AdminAlert>
      )}

      {query.success && (
        <AdminAlert
          variant="success"
          className="mt-5"
        >
          {query.success}
        </AdminAlert>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard
          icon={
            catalogModel.active
              ? Eye
              : EyeOff
          }
          label="Estado"
          value={
            catalogModel.active
              ? "Modelo activo"
              : "Modelo inactivo"
          }
          tone={
            catalogModel.active
              ? "emerald"
              : "red"
          }
        />

        <AdminSummaryCard
          icon={Tags}
          label="Marca"
          value={catalogModel.brand.name}
          tone="blue"
        />

        <AdminSummaryCard
          icon={Layers3}
          label="Categoría"
          value={categoryName}
          tone="violet"
        />

        <AdminSummaryCard
          icon={ImageIcon}
          label="Multimedia"
          value={`${imageCount} imagen${imageCount === 1 ? "" : "es"
            } · ${videoCount} video${videoCount === 1 ? "" : "s"
            }`}
          tone="amber"
        />
      </section>

      <form
        action={updateCatalogModel}
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]"
      >
        <input
          type="hidden"
          name="modelId"
          value={catalogModel.id}
        />

        <div className="space-y-6">
          <BrandCategorySelects
            mode="catalog"
            brands={brands.map(
              (brand) => ({
                id: brand.id,
                name: brand.name,
                category:
                  brand.category,
              })
            )}
            categories={catalogCategories.map(
              (category) => ({
                id: category.id,
                brandId:
                  category.brandId,
                name: category.name,
                parentId:
                  category.parentId,
                parentName:
                  category.parent
                    ?.name ?? null,
              })
            )}
            defaultBrandId={
              catalogModel.brandId
            }
            defaultCategoryId={
              catalogModel.categoryId
            }
          />

          <AdminSection
            icon={Layers3}
            eyebrow="Información principal"
            title="Datos del modelo"
            description="Actualiza la clasificación y la información comercial principal."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <AdminInput
                label="Nombre del modelo"
                name="name"
                required
                defaultValue={
                  catalogModel.name
                }
                containerClassName="md:col-span-2"
              />

              <AdminInput
                label="Subtítulo comercial"
                name="subtitle"
                defaultValue={
                  catalogModel.subtitle ??
                  ""
                }
                placeholder="Ej. Side-by-side deportivo para aventura extrema"
                containerClassName="md:col-span-2"
              />

              <AdminSelect
                label="Tipo"
                name="categoryType"
                defaultValue={
                  catalogModel.categoryType
                }
              >
                {Object.values(
                  VehicleCategory
                ).map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {getCategoryTypeLabel(
                      category
                    )}
                  </option>
                ))}
              </AdminSelect>

              <AdminInput
                label="Año modelo"
                name="year"
                type="number"
                min={1900}
                max={
                  new Date().getFullYear() +
                  3
                }
                defaultValue={
                  catalogModel.year ?? ""
                }
              />

              <AdminInput
                label="Precio desde"
                name="priceFrom"
                type="number"
                min={0}
                step="0.01"
                defaultValue={
                  catalogModel.priceFrom !==
                    null
                    ? Number(
                      catalogModel.priceFrom
                    )
                    : ""
                }
              />

              <AdminInput
                label="Orden"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={
                  catalogModel.sortOrder
                }
                description="Los valores menores aparecen primero."
              />
            </div>
          </AdminSection>

          <AdminSection
            icon={BookOpen}
            eyebrow="Ficha comercial"
            title="Contenido del modelo"
            description="Actualiza la descripción, especificaciones y características principales."
          >
            <div className="grid gap-5">
              <AdminTextarea
                label="Descripción"
                name="description"
                rows={5}
                defaultValue={
                  catalogModel.description ??
                  ""
                }
              />

              <AdminTextarea
                label="Especificaciones rápidas"
                name="specs"
                rows={4}
                defaultValue={
                  catalogModel.specs ?? ""
                }
                description="Puedes separar cada especificación con comas o saltos de línea."
              />

              <AdminTextarea
                label="Características principales"
                name="features"
                rows={5}
                defaultValue={
                  catalogModel.features ??
                  ""
                }
                description="Puedes separar cada característica con comas o saltos de línea."
              />
            </div>
          </AdminSection>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-100 bg-[#f8fafb] p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#192a3a] text-white">
                    <Eye size={18} />
                  </span>

                  <div>
                    <h2 className="text-xl font-black">
                      Publicación
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Controla la disponibilidad del modelo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <AdminToggleOption
                  name="active"
                  title="Modelo activo"
                  description="Podrá seleccionarse al registrar unidades reales."
                  icon={
                    catalogModel.active
                      ? Eye
                      : EyeOff
                  }
                  defaultChecked={
                    catalogModel.active
                  }
                />

                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
                >
                  <Save size={17} />
                  Guardar cambios
                </button>

                <Link
                  href="/admin/catalogo"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
                >
                  Cancelar
                </Link>
              </div>
            </section>

            <AdminSection
              icon={ImageIcon}
              eyebrow="Imagen principal"
              title="Portada"
              description="Configura la imagen representativa del modelo."
              contentClassName="p-5"
            >
              <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-[#f8fafb]">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={
                      catalogModel.name
                    }
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-56 place-items-center text-slate-400">
                    <div className="text-center">
                      <ImageIcon
                        size={40}
                        className="mx-auto"
                      />

                      <p className="mt-2 text-[9px] font-black uppercase tracking-[0.12em]">
                        Sin portada
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <AdminInput
                  label="URL manual"
                  name="mainImageUrl"
                  defaultValue={
                    catalogModel.mainImage ??
                    ""
                  }
                  placeholder="/uploads/vehicles/imagen.webp"
                  description="También puedes utilizar una URL externa."
                />
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Agregar multimedia
                </span>

                <div className="rounded-[16px] border border-dashed border-slate-300 bg-[#f8fafb] p-4">
                  <Upload
                    size={24}
                    className="mx-auto text-[#192a3a]"
                  />

                  <p className="mt-3 text-center text-xs font-black text-slate-700">
                    Imágenes o videos
                  </p>

                  <input
                    name="mediaFiles"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                    className="mt-4 block w-full text-xs font-semibold text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-[#192a3a] file:px-3 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-[#29465c]"
                  />
                </div>

                <span className="mt-2 block text-xs leading-5 text-slate-500">
                  Los archivos nuevos se agregan a la galería actual.
                </span>
              </label>
            </AdminSection>

            <AdminSection
              icon={Tags}
              eyebrow="Galería"
              title="Archivos actuales"
              description={`${catalogModel.images.length} archivo${catalogModel.images.length ===
                  1
                  ? ""
                  : "s"
                } registrado${catalogModel.images.length ===
                  1
                  ? ""
                  : "s"
                }.`}
              contentClassName="p-5"
            >
              <div className="grid gap-4">
                {catalogModel.images.length >
                  0 ? (
                  catalogModel.images.map(
                    (image) => {
                      const isImage =
                        image.type ===
                        VehicleMediaType.IMAGE;

                      const isMain =
                        catalogModel.mainImage ===
                        image.url;

                      return (
                        <article
                          key={image.id}
                          className="overflow-hidden rounded-[16px] border border-slate-200 bg-[#f8fafb]"
                        >
                          <div className="relative">
                            {isImage ? (
                              <img
                                src={image.url}
                                alt={
                                  image.alt ??
                                  catalogModel.name
                                }
                                className="h-44 w-full object-cover"
                              />
                            ) : (
                              <video
                                src={image.url}
                                controls
                                preload="metadata"
                                className="h-44 w-full bg-black object-cover"
                              />
                            )}

                            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-white backdrop-blur">
                              {isImage ? (
                                <ImageIcon
                                  size={12}
                                />
                              ) : (
                                <Video
                                  size={12}
                                />
                              )}

                              {isImage
                                ? "Imagen"
                                : "Video"}
                            </span>

                            {isMain && (
                              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-amber-600 shadow-sm">
                                <Star
                                  size={13}
                                />
                                Principal
                              </span>
                            )}
                          </div>

                          <div className="grid gap-2 p-3">
                            {isImage && (
                              <button
                                type="submit"
                                formAction={setCatalogMainImage.bind(
                                  null,
                                  catalogModel.id,
                                  image.id
                                )}
                                formNoValidate
                                disabled={isMain}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:border-[#192a3a] hover:text-[#192a3a] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                              >
                                <Star size={14} />

                                {isMain
                                  ? "Imagen principal"
                                  : "Usar como principal"}
                              </button>
                            )}

                            <button
                              type="submit"
                              formAction={deleteCatalogImage.bind(
                                null,
                                catalogModel.id,
                                image.id
                              )}
                              formNoValidate
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-xs font-black text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
                            >
                              <Trash2
                                size={14}
                              />
                              Eliminar archivo
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )
                ) : (
                  <div className="rounded-[16px] border border-dashed border-slate-300 bg-[#f8fafb] p-8 text-center">
                    <ImageIcon
                      size={38}
                      className="mx-auto text-slate-400"
                    />

                    <p className="mt-3 text-sm font-black text-slate-600">
                      Sin archivos
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Agrega imágenes o videos desde el apartado superior.
                    </p>
                  </div>
                )}
              </div>
            </AdminSection>

            <AdminAlert variant="info">
              Solo los archivos de imagen pueden utilizarse como portada principal.
            </AdminAlert>
          </div>
        </aside>
      </form>
    </div>
  );
}