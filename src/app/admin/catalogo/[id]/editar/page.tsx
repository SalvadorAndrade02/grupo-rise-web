import type { ReactNode } from "react";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { revalidatePath } from "next/cache";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  ImageIcon,
  Info,
  Layers3,
  Plus,
  Save,
  Sparkles,
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
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
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

const validCategories: VehicleCategory[] = [
  VehicleCategory.AUTO,
  VehicleCategory.MOTO,
  VehicleCategory.TODOTERRENO,
];

function getStringValue(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) ?? ""
  ).trim();
}

function getOptionalNumberValue(
  formData: FormData,
  fieldName: string
) {
  const rawValue = String(
    formData.get(fieldName) ?? ""
  ).trim();

  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);

  return Number.isFinite(value)
    ? value
    : null;
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
): VehicleCategory {
  const categoryValue = String(
    value ||
    VehicleCategory.TODOTERRENO
  );

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
    TODOTERRENO: "Todoterreno",
  };

  return labels[category];
}

function redirectEditError(
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
}

async function updateCatalogModel(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const modelId = Number(
    formData.get("modelId")
  );

  if (
    !Number.isInteger(modelId) ||
    modelId <= 0
  ) {
    redirect(
      `/admin/catalogo?error=${encodeURIComponent(
        "No se pudo identificar el modelo."
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
          orderBy: [
            {
              order: "asc",
            },
            {
              id: "asc",
            },
          ],
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

  const brandId = Number(
    formData.get("brandId")
  );

  const categoryId =
    getOptionalNumberValue(
      formData,
      "categoryId"
    );

  const name = getStringValue(
    formData,
    "name"
  );

  const subtitle = getStringValue(
    formData,
    "subtitle"
  );

  const description = getStringValue(
    formData,
    "description"
  );

  const specs = getStringValue(
    formData,
    "specs"
  );

  const features = getStringValue(
    formData,
    "features"
  );

  const year = getOptionalNumberValue(
    formData,
    "year"
  );

  const priceFrom =
    getOptionalNumberValue(
      formData,
      "priceFrom"
    );

  const sortOrder =
    getOptionalNumberValue(
      formData,
      "sortOrder"
    ) ?? 0;

  const categoryType =
    getVehicleCategoryValue(
      formData.get("categoryType")
    );

  const active =
    formData.get("active") === "on";

  const mainImageUrl = getStringValue(
    formData,
    "mainImageUrl"
  );

  if (!brandId) {
    redirectEditError(
      modelId,
      "Selecciona una marca para el modelo."
    );
  }

  if (!name) {
    redirectEditError(
      modelId,
      "Captura el nombre del modelo."
    );
  }

  if (
    year !== null &&
    (!Number.isInteger(year) ||
      year < 1900 ||
      year > 2100)
  ) {
    redirectEditError(
      modelId,
      "El año del modelo no es válido."
    );
  }

  if (
    priceFrom !== null &&
    (!Number.isFinite(priceFrom) ||
      priceFrom < 0)
  ) {
    redirectEditError(
      modelId,
      "El precio base no es válido."
    );
  }

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    redirectEditError(
      modelId,
      "El orden debe ser un número entero igual o mayor a cero."
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
        },
      }),

      categoryId
        ? prisma.catalogCategory.findUnique({
          where: {
            id: categoryId,
          },

          select: {
            id: true,
            brandId: true,
            active: true,
          },
        })
        : Promise.resolve(null),
    ]);

  if (!brand) {
    redirectEditError(
      modelId,
      "La marca seleccionada ya no existe."
    );
  }

  if (categoryId && !category) {
    redirectEditError(
      modelId,
      "La categoría seleccionada ya no existe."
    );
  }

  if (
    category &&
    category.brandId !== brandId
  ) {
    redirectEditError(
      modelId,
      "La categoría seleccionada no pertenece a la marca."
    );
  }

  /*
   * Se permite conservar la marca o categoría
   * actual aunque esté inactiva. Para cambiar a
   * otra relación, esta debe estar activa.
   */
  if (
    !brand.active &&
    brandId !== currentModel.brandId
  ) {
    redirectEditError(
      modelId,
      "No puedes asignar una marca inactiva."
    );
  }

  if (
    category &&
    !category.active &&
    category.id !==
    currentModel.categoryId
  ) {
    redirectEditError(
      modelId,
      "No puedes asignar una categoría inactiva."
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
      "Error guardando archivos del catálogo:",
      error
    );

    redirectEditError(
      modelId,
      error instanceof Error
        ? error.message
        : "No se pudieron guardar los archivos."
    );
  }

  const currentHighestOrder =
    currentModel.images.reduce(
      (highest, image) =>
        image.order > highest
          ? image.order
          : highest,
      -1
    );

  const firstUploadedImage =
    savedMedia.find(
      (item) =>
        item.type ===
        VehicleMediaType.IMAGE
    );

  const firstExistingImage =
    currentModel.images.find(
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
        categoryId:
          categoryId || null,
        name,
        slug,
        categoryType,
        year,
        priceFrom,
        subtitle,
        description,
        specs,
        features,
        mainImage:
          finalMainImage,
        active,
        sortOrder,

        images:
          savedMedia.length > 0
            ? {
              create: savedMedia.map(
                (item, index) => ({
                  url: item.url,
                  type: item.type,
                  alt: name,

                  order:
                    currentHighestOrder +
                    index +
                    1,
                })
              ),
            }
            : undefined,
      },
    });
  } catch (error) {
    for (const item of savedMedia) {
      if (
        item.url.startsWith(
          "/uploads/"
        )
      ) {
        try {
          await deletePublicFile(
            item.url
          );
        } catch (cleanupError) {
          console.error(
            "No se pudo limpiar el archivo:",
            cleanupError
          );
        }
      }
    }

    console.error(
      "Error actualizando modelo:",
      error
    );

    redirectEditError(
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

  if (!modelId || !imageId) {
    return;
  }

  const image =
    await prisma.catalogImage.findUnique({
      where: {
        id: imageId,
      },
    });

  if (
    !image ||
    image.catalogModelId !== modelId
  ) {
    redirectEditError(
      modelId,
      "No se pudo identificar la imagen."
    );
  }

  if (
    image.type !==
    VehicleMediaType.IMAGE
  ) {
    redirectEditError(
      modelId,
      "Un video no puede utilizarse como imagen principal."
    );
  }

  const images =
    await prisma.catalogImage.findMany({
      where: {
        catalogModelId: modelId,
      },

      orderBy: [
        {
          order: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

  const reorderedImages = [
    image,
    ...images.filter(
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

    ...reorderedImages.map(
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

  if (!modelId || !imageId) {
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
              orderBy: [
                {
                  order: "asc",
                },
                {
                  id: "asc",
                },
              ],
            },
          },
        },
      },
    });

  if (
    !image ||
    image.catalogModelId !== modelId
  ) {
    redirectEditError(
      modelId,
      "No se pudo identificar el archivo."
    );
  }

  const remainingImages =
    image.catalogModel.images.filter(
      (item) => item.id !== image.id
    );

  const isCurrentMainImage =
    image.catalogModel.mainImage ===
    image.url;

  const nextMainImage =
    isCurrentMainImage
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

  if (
    image.url.startsWith("/uploads/")
  ) {
    try {
      await deletePublicFile(image.url);
    } catch (error) {
      console.error(
        "No se pudo eliminar el archivo:",
        error
      );
    }
  }

  revalidateCatalogPaths(modelId);

  redirect(
    `/admin/catalogo/${modelId}/editar?success=${encodeURIComponent(
      image.type ===
        VehicleMediaType.VIDEO
        ? "Video eliminado correctamente."
        : "Imagen eliminada correctamente."
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
          orderBy: [
            {
              order: "asc",
            },
            {
              id: "asc",
            },
          ],
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
                  id:
                    catalogModel.categoryId,
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
        image.type ===
        VehicleMediaType.VIDEO
    ).length;

  const categoryName =
    catalogModel.category?.name ??
    "Sin categoría";

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <Link
              href="/admin/catalogo"
              className="inline-flex items-center gap-2 text-xs font-black text-white/60 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Volver al catálogo
            </Link>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
              <Tags size={15} />
              Modelo #{catalogModel.id}
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
              {catalogModel.brand.name}{" "}
              {catalogModel.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              Actualiza la información comercial,
              clasificación, publicación y galería
              utilizada al crear unidades reales.
            </p>
          </div>

          <Link
            href="/admin/inventario/nuevo"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
          >
            <Plus size={17} />
            Crear unidad

            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </section>

      {/* Mensajes */}
      {query.error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700"
        >
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>{query.error}</span>
        </div>
      )}

      {query.success && (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-700"
        >
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>{query.success}</span>
        </div>
      )}

      {/* Resumen */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Tags}
          label="Marca"
          value={catalogModel.brand.name}
        />

        <SummaryCard
          icon={Layers3}
          label="Categoría"
          value={categoryName}
        />

        <SummaryCard
          icon={CalendarDays}
          label="Año modelo"
          value={
            catalogModel.year
              ? String(catalogModel.year)
              : "Sin definir"
          }
        />

        <SummaryCard
          icon={ImageIcon}
          label="Galería"
          value={`${imageCount} imagen${imageCount === 1 ? "" : "es"
            } · ${videoCount} video${videoCount === 1 ? "" : "s"
            }`}
        />
      </section>

      <form
        action={updateCatalogModel}
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]"
      >
        <input
          type="hidden"
          name="modelId"
          value={catalogModel.id}
        />

        <div className="space-y-6">
          {/* Clasificación */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Sparkles}
              eyebrow="Clasificación"
              title="Marca y categoría"
              description="Modifica las relaciones comerciales del modelo."
            />

            <div className="p-5 md:p-6">
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

              {(!catalogModel.brand.active ||
                (catalogModel.category &&
                  !catalogModel.category
                    .active)) && (
                  <div className="mt-5 flex items-start gap-3 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
                    <Info
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />

                    <p className="text-xs font-semibold leading-5 text-amber-800">
                      Este modelo conserva una marca
                      o categoría inactiva. Puedes
                      mantenerla o seleccionar una
                      relación activa.
                    </p>
                  </div>
                )}
            </div>
          </section>

          {/* Datos comerciales */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Layers3}
              eyebrow="Información comercial"
              title="Datos del modelo"
              description="Actualiza nombre, tipo, año, precio y orden."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
              <div className="md:col-span-2">
                <FormInput
                  label="Nombre del modelo"
                  name="name"
                  required
                  defaultValue={
                    catalogModel.name
                  }
                />
              </div>

              <div className="md:col-span-2">
                <FormInput
                  label="Subtítulo comercial"
                  name="subtitle"
                  defaultValue={
                    catalogModel.subtitle ??
                    ""
                  }
                  placeholder="Ej. Side-by-side deportivo para aventura extrema"
                />
              </div>

              <FormSelect
                label="Tipo comercial"
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
              </FormSelect>

              <FormInput
                label="Año modelo"
                name="year"
                type="number"
                min={1900}
                max={2100}
                defaultValue={
                  catalogModel.year ?? ""
                }
              />

              <FormInput
                label="Precio desde"
                name="priceFrom"
                type="number"
                min={0}
                defaultValue={
                  catalogModel.priceFrom ??
                  ""
                }
              />

              <FormInput
                label="Orden"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={
                  catalogModel.sortOrder
                }
                description="Los números menores aparecen primero."
              />
            </div>
          </section>

          {/* Contenido */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Tags}
              eyebrow="Contenido"
              title="Ficha comercial"
              description="Edita la información reutilizada al registrar unidades."
            />

            <div className="grid gap-5 p-5 md:p-6">
              <FormTextarea
                label="Descripción"
                name="description"
                rows={6}
                defaultValue={
                  catalogModel.description ??
                  ""
                }
              />

              <FormTextarea
                label="Especificaciones rápidas"
                name="specs"
                rows={4}
                defaultValue={
                  catalogModel.specs ?? ""
                }
                description="Separa las especificaciones utilizando comas."
              />

              <FormTextarea
                label="Características principales"
                name="features"
                rows={5}
                defaultValue={
                  catalogModel.features ??
                  ""
                }
              />
            </div>
          </section>
        </div>

        {/* Columna lateral */}
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-5">
            {/* Publicación */}
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
                      Controla si puede utilizarse
                      como plantilla.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <ToggleOption
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

                <div className="rounded-[16px] border border-[#192a3a]/10 bg-[#e7edf1] p-4">
                  <p className="flex items-center gap-2 text-sm font-black text-[#192a3a]">
                    <BadgeCheck size={17} />
                    Estado actual
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    {catalogModel.active
                      ? "Este modelo está disponible para crear unidades."
                      : "Este modelo se encuentra oculto y no debería aparecer como opción nueva."}
                  </p>
                </div>

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

            {/* Imagen principal */}
            <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 bg-[#f8fafb] p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7edf1] text-[#192a3a]">
                    <ImageIcon size={18} />
                  </span>

                  <div>
                    <h2 className="text-xl font-black">
                      Imagen principal
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Portada comercial del modelo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-slate-100">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={catalogModel.name}
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-56 place-items-center text-slate-400">
                      <div className="text-center">
                        <ImageIcon
                          size={42}
                          className="mx-auto"
                        />

                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em]">
                          Sin imagen
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 grid gap-5">
                  <FormInput
                    label="URL manual"
                    name="mainImageUrl"
                    defaultValue={
                      catalogModel.mainImage ??
                      ""
                    }
                    placeholder="https://..."
                    description="La galería seguirá conservando sus archivos."
                  />

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      Agregar archivos
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
                      Los archivos nuevos se agregan
                      a la galería existente.
                    </span>
                  </label>
                </div>
              </div>
            </section>

            {/* Galería */}
            <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 bg-[#f8fafb] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#192a3a]">
                      Galería
                    </p>

                    <h2 className="mt-2 text-xl font-black">
                      Archivos actuales
                    </h2>
                  </div>

                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black text-slate-500">
                    {catalogModel.images.length}{" "}
                    archivo
                    {catalogModel.images.length ===
                      1
                      ? ""
                      : "s"}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                {catalogModel.images.length >
                  0 ? (
                  catalogModel.images.map(
                    (image) => {
                      const isMain =
                        catalogModel.mainImage ===
                        image.url;

                      return (
                        <article
                          key={image.id}
                          className="overflow-hidden rounded-[16px] border border-slate-200 bg-[#f8fafb]"
                        >
                          <div className="relative">
                            {image.type ===
                              VehicleMediaType.IMAGE ? (
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
                                className="h-44 w-full bg-black object-cover"
                              />
                            )}

                            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white backdrop-blur-sm">
                              {image.type ===
                                VehicleMediaType.IMAGE ? (
                                <ImageIcon
                                  size={11}
                                />
                              ) : (
                                <Video size={11} />
                              )}

                              {image.type ===
                                VehicleMediaType.IMAGE
                                ? "Imagen"
                                : "Video"}
                            </span>

                            {isMain && (
                              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.08em] text-amber-700 shadow-sm">
                                <Star size={12} />
                                Principal
                              </span>
                            )}
                          </div>

                          <div className="grid gap-2 p-3">
                            {image.type ===
                              VehicleMediaType.IMAGE && (
                                <button
                                  type="submit"
                                  formAction={setCatalogMainImage.bind(
                                    null,
                                    catalogModel.id,
                                    image.id
                                  )}
                                  formNoValidate
                                  disabled={isMain}
                                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-700 transition hover:border-[#192a3a] hover:bg-[#e7edf1] disabled:cursor-not-allowed disabled:opacity-50"
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
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-[10px] font-black text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
                            >
                              <Trash2 size={14} />
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
                      size={40}
                      className="mx-auto text-slate-400"
                    />

                    <p className="mt-3 text-sm font-black text-slate-600">
                      Sin archivos
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Agrega imágenes o videos
                      desde el bloque superior.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </aside>
      </form>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]">
        <Icon size={20} />
      </span>

      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-black text-[#192a3a]">
        {value}
      </p>
    </article>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-100 bg-[#f8fafb] p-5 md:p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#192a3a] text-white">
          <Icon size={20} />
        </span>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#192a3a]">
            {eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">
            {title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  name,
  type = "text",
  required = false,
  min,
  max,
  placeholder,
  defaultValue,
  description,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  defaultValue?: string | number;
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
        min={min}
        max={max}
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
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: ReactNode;
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

function FormTextarea({
  label,
  name,
  rows,
  defaultValue,
  description,
}: {
  label: string;
  name: string;
  rows: number;
  defaultValue?: string;
  description?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      />

      {description && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}
    </label>
  );
}

function ToggleOption({
  name,
  title,
  description,
  icon: Icon,
  defaultChecked,
}: {
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-slate-200 bg-[#f8fafb] p-4 transition hover:border-[#192a3a]/30">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-[#192a3a]"
      />

      <Icon
        size={17}
        className="mt-0.5 shrink-0 text-[#192a3a]"
      />

      <span>
        <span className="block text-sm font-black text-slate-700">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}