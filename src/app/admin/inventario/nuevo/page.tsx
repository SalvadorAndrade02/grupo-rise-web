import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Building2,
  Car,
  CheckCircle2,
  Eye,
  Gauge,
  ImageIcon,
  MapPin,
  Save,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleCondition,
  VehicleMediaType,
  VehicleStatus,
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

type NewVehiclePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

type CatalogMediaItem = {
  url: string;
  type: VehicleMediaType;
  alt: string | null;
  order: number;
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

function parseCatalogImages(
  formData: FormData
): CatalogMediaItem[] {
  const rawValue = getTextValue(
    formData,
    "catalogImages"
  );

  if (!rawValue) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item, index) => {
        if (
          typeof item !== "object" ||
          item === null
        ) {
          return null;
        }

        const mediaItem = item as {
          url?: unknown;
          type?: unknown;
          alt?: unknown;
        };

        const url =
          typeof mediaItem.url ===
            "string"
            ? mediaItem.url.trim()
            : "";

        if (!url) {
          return null;
        }

        const type =
          mediaItem.type ===
            VehicleMediaType.VIDEO
            ? VehicleMediaType.VIDEO
            : VehicleMediaType.IMAGE;

        const alt =
          typeof mediaItem.alt ===
            "string"
            ? mediaItem.alt.trim() ||
            null
            : null;

        return {
          url,
          type,
          alt,
          order: index,
        };
      })
      .filter(
        (
          item
        ): item is CatalogMediaItem =>
          item !== null
      );
  } catch {
    return [];
  }
}

function getVehicleCondition(
  value: FormDataEntryValue | null
) {
  return value ===
    VehicleCondition.SEMINUEVO
    ? VehicleCondition.SEMINUEVO
    : VehicleCondition.NUEVO;
}

function getVehicleStatus(
  value: FormDataEntryValue | null
) {
  const status = String(
    value ||
    VehicleStatus.DISPONIBLE
  );

  const validStatuses: VehicleStatus[] =
    [
      VehicleStatus.DISPONIBLE,
      VehicleStatus.APARTADO,
      VehicleStatus.VENDIDO,
      VehicleStatus.EN_TRANSITO,
      VehicleStatus.PROXIMAMENTE,
      VehicleStatus.INACTIVO,
    ];

  return validStatuses.includes(
    status as VehicleStatus
  )
    ? (status as VehicleStatus)
    : VehicleStatus.DISPONIBLE;
}

function getVehicleCategory(
  value: FormDataEntryValue | null
) {
  const category = String(
    value || VehicleCategory.AUTO
  );

  const validCategories: VehicleCategory[] = [
    VehicleCategory.AUTO,
    VehicleCategory.MOTO,
    VehicleCategory.TODOTERRENO,
    VehicleCategory.NAUTICA,
  ];

  return validCategories.includes(
    category as VehicleCategory
  )
    ? (category as VehicleCategory)
    : VehicleCategory.AUTO;
}

function isValidMediaReference(
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

function redirectVehicleError(
  message: string
): never {
  redirect(
    `/admin/inventario/nuevo?error=${encodeURIComponent(
      message
    )}`
  );
}

function revalidateVehiclePaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
  revalidatePath(
    "/admin/inventario/nuevo"
  );
  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath("/");
}

async function safelyDeleteMedia(
  media: {
    url: string;
  }[]
) {
  await Promise.allSettled(
    media.map(async (item) => {
      if (
        !item.url.startsWith(
          "/uploads/"
        )
      ) {
        return;
      }

      try {
        await deletePublicFile(
          item.url
        );
      } catch (error) {
        console.error(
          `No se pudo eliminar ${item.url}:`,
          error
        );
      }
    })
  );
}

async function createVehicle(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const brandId =
    getPositiveIntegerValue(
      formData,
      "brandId"
    );

  const branchId =
    getPositiveIntegerValue(
      formData,
      "branchId"
    );

  const categoryId =
    getPositiveIntegerValue(
      formData,
      "categoryId"
    );

  const catalogModelId =
    getPositiveIntegerValue(
      formData,
      "catalogModelId"
    );

  const name = getTextValue(
    formData,
    "name"
  );

  const model =
    getTextValue(
      formData,
      "model"
    ) || name;

  const category =
    getVehicleCategory(
      formData.get("category")
    );

  const type =
    getTextValue(
      formData,
      "type"
    ) ||
    category;

  const condition =
    getVehicleCondition(
      formData.get("condition")
    );

  const status =
    getVehicleStatus(
      formData.get("status")
    );

  const active =
    formData.get("active") === "on";

  const isFeatured =
    formData.get("isFeatured") ===
    "on";

  const requestedBranchIds =
    formData
      .getAll("branchIds")
      .map((value) => Number(value))
      .filter(
        (value) =>
          Number.isInteger(value) &&
          value > 0
      );

  const uniqueBranchIds =
    Array.from(
      new Set([
        branchId,
        ...requestedBranchIds,
      ])
    ).filter(
      (value) => value > 0
    );

  if (
    !brandId ||
    !branchId ||
    !name ||
    !model
  ) {
    redirectVehicleError(
      "Selecciona un modelo, una marca y una sucursal principal."
    );
  }

  const [
    brand,
    mainBranch,
    selectedCategory,
    selectedCatalogModel,
    availableBranches,
  ] = await Promise.all([
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

    prisma.branch.findUnique({
      where: {
        id: branchId,
      },

      select: {
        id: true,
        active: true,
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
            brandId: true,
            active: true,
          },
        }
      )
      : Promise.resolve(null),

    catalogModelId
      ? prisma.catalogModel.findUnique(
        {
          where: {
            id: catalogModelId,
          },

          include: {
            images: {
              orderBy: {
                order: "asc",
              },
            },
          },
        }
      )
      : Promise.resolve(null),

    prisma.branch.findMany({
      where: {
        id: {
          in: uniqueBranchIds,
        },
        active: true,
      },

      select: {
        id: true,
      },
    }),
  ]);

  if (!brand || !brand.active) {
    redirectVehicleError(
      "La marca seleccionada no existe o está inactiva."
    );
  }

  if (
    brand.category !== category
  ) {
    redirectVehicleError(
      "La categoría del vehículo no coincide con la clasificación de la marca."
    );
  }

  if (
    !mainBranch ||
    !mainBranch.active
  ) {
    redirectVehicleError(
      "La sucursal principal no existe o está inactiva."
    );
  }

  if (
    availableBranches.length !==
    uniqueBranchIds.length
  ) {
    redirectVehicleError(
      "Una de las sucursales seleccionadas no existe o está inactiva."
    );
  }

  if (
    categoryId &&
    (!selectedCategory ||
      !selectedCategory.active ||
      selectedCategory.brandId !==
      brandId)
  ) {
    redirectVehicleError(
      "La categoría seleccionada no corresponde con la marca."
    );
  }

  if (
    catalogModelId &&
    (!selectedCatalogModel ||
      !selectedCatalogModel.active ||
      selectedCatalogModel.brandId !==
      brandId)
  ) {
    redirectVehicleError(
      "El modelo comercial seleccionado no corresponde con la marca."
    );
  }

  const explicitYear =
    getOptionalNumberValue(
      formData,
      "year"
    );

  const hiddenCatalogYear =
    getOptionalNumberValue(
      formData,
      "catalogYear"
    );

  const year =
    explicitYear ??
    selectedCatalogModel?.year ??
    hiddenCatalogYear ??
    0;

  const explicitPrice =
    getOptionalNumberValue(
      formData,
      "price"
    );

  const hiddenCatalogPrice =
    getOptionalNumberValue(
      formData,
      "catalogPriceFrom"
    );

  const modelPrice =
    selectedCatalogModel
      ?.priceFrom !== null &&
      selectedCatalogModel
        ?.priceFrom !== undefined
      ? Number(
        selectedCatalogModel.priceFrom
      )
      : null;

  const price =
    explicitPrice ??
    modelPrice ??
    hiddenCatalogPrice ??
    0;

  const mileage =
    getOptionalNumberValue(
      formData,
      "mileage"
    );

  if (
    !Number.isInteger(year) ||
    year < 1900 ||
    year >
    new Date().getFullYear() + 3
  ) {
    redirectVehicleError(
      "El año del vehículo no es válido."
    );
  }

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    redirectVehicleError(
      "El precio del vehículo no es válido."
    );
  }

  if (
    mileage !== null &&
    (!Number.isInteger(mileage) ||
      mileage < 0)
  ) {
    redirectVehicleError(
      "El kilometraje debe ser un número entero igual o mayor a cero."
    );
  }

  const specs =
    getTextValue(
      formData,
      "specs"
    ) ||
    selectedCatalogModel?.specs ||
    getTextValue(
      formData,
      "catalogSpecs"
    );

  const features =
    getTextValue(
      formData,
      "features"
    ) ||
    selectedCatalogModel?.features ||
    getTextValue(
      formData,
      "catalogFeatures"
    );

  const description =
    getTextValue(
      formData,
      "description"
    ) ||
    selectedCatalogModel
      ?.description ||
    getTextValue(
      formData,
      "catalogDescription"
    );

  const mainImageInput =
    getTextValue(
      formData,
      "mainImage"
    ) ||
    getTextValue(
      formData,
      "catalogMainImage"
    );

  if (
    !isValidMediaReference(
      mainImageInput
    )
  ) {
    redirectVehicleError(
      "La referencia de la imagen principal no es válida."
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
      "Error guardando multimedia:",
      error
    );

    redirectVehicleError(
      error instanceof Error
        ? error.message
        : "No se pudieron guardar los archivos del vehículo."
    );
  }

  const inheritedCatalogMedia:
    CatalogMediaItem[] =
    selectedCatalogModel
      ? selectedCatalogModel.images.map(
        (item, index) => ({
          url: item.url,
          type: item.type,
          alt: item.alt,
          order: index,
        })
      )
      : parseCatalogImages(
        formData
      );

  const finalGalleryMedia: {
    url: string;
    type: VehicleMediaType;
    alt: string;
    order: number;
  }[] =
    savedMedia.length > 0
      ? savedMedia.map(
        (item, index) => ({
          url: item.url,
          type: item.type,
          alt: name,
          order: index,
        })
      )
      : inheritedCatalogMedia.map(
        (item, index) => ({
          url: item.url,
          type: item.type,
          alt: item.alt ?? name,
          order: index,
        })
      );

  const firstUploadedImage =
    savedMedia.find(
      (item) =>
        item.type ===
        VehicleMediaType.IMAGE
    );

  const firstCatalogImage =
    inheritedCatalogMedia.find(
      (item) =>
        item.type ===
        VehicleMediaType.IMAGE
    );

  const finalMainImage =
    firstUploadedImage?.url ||
    mainImageInput ||
    selectedCatalogModel
      ?.mainImage ||
    firstCatalogImage?.url ||
    "";

  try {
    await prisma.vehicle.create({
      data: {
        name,
        model,
        type,
        brandId,
        branchId,
        category,
        condition,
        status,
        year,
        price,
        mileage,
        description,
        specs,
        features,
        mainImage:
          finalMainImage,
        active,
        isFeatured,

        images:
          finalGalleryMedia.length > 0
            ? {
              create: finalGalleryMedia,
            }
            : undefined,

        branchAvailabilities: {
          create:
            uniqueBranchIds.map(
              (
                availabilityBranchId
              ) => ({
                branchId:
                  availabilityBranchId,
              })
            ),
        },
      },
    });
  } catch (error) {
    await safelyDeleteMedia(
      savedMedia
    );

    console.error(
      "Error creando vehículo:",
      error
    );

    redirectVehicleError(
      "No se pudo registrar el vehículo."
    );
  }

  revalidateVehiclePaths();

  redirect(
    `/admin/inventario?success=${encodeURIComponent(
      "Vehículo registrado correctamente."
    )}`
  );
}

export default async function NewVehiclePage({
  searchParams,
}: NewVehiclePageProps) {
  await requireAdmin();

  const query = await searchParams;

  const [
    brands,
    branches,
    catalogModels,
    catalogCategories,
  ] = await Promise.all([
    prisma.brand.findMany({
      where: {
        active: true,
      },

      orderBy: {
        name: "asc",
      },
    }),

    prisma.branch.findMany({
      where: {
        active: true,
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

    prisma.catalogModel.findMany({
      where: {
        active: true,

        brand: {
          active: true,
        },
      },

      include: {
        category: true,

        images: {
          orderBy: {
            order: "asc",
          },
        },
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

  const currentYear =
    new Date().getFullYear();

  return (
    <div className="pb-10">
      <AdminHero
        eyebrow="Inventario de unidades"
        title="Registrar vehículo"
        description="Registra una unidad nueva o seminueva, asigna sus sucursales y configura su publicación en el sitio."
        icon={Car}
        backHref="/admin/inventario"
        backLabel="Volver al inventario"
      />

      {query.error && (
        <AdminAlert
          variant="error"
          className="mt-5"
        >
          {query.error}
        </AdminAlert>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard
          icon={Car}
          label="Modelo"
          value="Catálogo comercial"
        />

        <AdminSummaryCard
          icon={Building2}
          label="Disponibilidad"
          value="Una o más sucursales"
          tone="blue"
        />

        <AdminSummaryCard
          icon={ImageIcon}
          label="Multimedia"
          value="Fotos y videos"
          tone="violet"
        />

        <AdminSummaryCard
          icon={Eye}
          label="Publicación"
          value="Nuevo o seminuevo"
          tone="emerald"
        />
      </section>

      <form
        action={createVehicle}
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]"
      >
        <div className="space-y-6">
          <BrandCategorySelects
            mode="vehicle"
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
            catalogModels={catalogModels.map(
              (model) => ({
                id: model.id,
                brandId:
                  model.brandId,

                categoryId:
                  model.categoryId,

                name: model.name,

                categoryType:
                  model.categoryType,

                year: model.year,

                priceFrom:
                  model.priceFrom,

                subtitle:
                  model.subtitle,

                description:
                  model.description,

                specs: model.specs,

                features:
                  model.features,

                mainImage:
                  model.mainImage,

                categoryName:
                  model.category
                    ?.name ?? null,

                images:
                  model.images.map(
                    (image) => ({
                      url: image.url,
                      type: image.type,
                      alt: image.alt,
                      order: image.order,
                    })
                  ),
              })
            )}
          />

          <AdminSection
            icon={Car}
            eyebrow="Información comercial"
            title="Datos de la unidad"
            description="Completa el año, precio y kilometraje de la unidad real."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <AdminInput
                label="Año"
                name="year"
                required
                type="number"
                min={1900}
                max={
                  currentYear + 3
                }
                defaultValue={
                  currentYear
                }
                description="Puede actualizarse automáticamente al elegir un modelo base."
              />

              <AdminInput
                label="Precio"
                name="price"
                required
                type="number"
                min={0}
                step="0.01"
                placeholder="799000"
                description="Precio público de esta unidad."
              />

              <AdminInput
                label="Kilometraje"
                name="mileage"
                type="number"
                min={0}
                step={1}
                placeholder="0"
                description="En unidades nuevas puede dejarse vacío o en cero."
                containerClassName="md:col-span-2"
              />
            </div>
          </AdminSection>

          <AdminSection
            icon={MapPin}
            eyebrow="Disponibilidad"
            title="Sucursales"
            description="Selecciona la sucursal principal y otras ubicaciones donde también estará disponible."
          >
            <div className="grid gap-5">
              <AdminSelect
                label="Sucursal principal"
                name="branchId"
                required
                defaultValue=""
              >
                <option value="">
                  Selecciona una sucursal
                </option>

                {branches.map(
                  (branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name} ·{" "}
                      {branch.city}
                    </option>
                  )
                )}
              </AdminSelect>

              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Disponible también en
                </p>

                <div className="grid gap-3 rounded-[16px] border border-slate-200 bg-[#f8fafb] p-4 md:grid-cols-2">
                  {branches.map(
                    (branch) => (
                      <label
                        key={branch.id}
                        className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-slate-100 bg-white p-4 transition hover:border-[#192a3a]/30"
                      >
                        <input
                          type="checkbox"
                          name="branchIds"
                          value={
                            branch.id
                          }
                          className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-[#192a3a]"
                        />

                        <span>
                          <span className="block text-sm font-black text-[#192a3a]">
                            {branch.name}
                          </span>

                          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                            {branch.city},{" "}
                            {branch.state}
                          </span>
                        </span>
                      </label>
                    )
                  )}
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  La sucursal principal se
                  agregará automáticamente,
                  aunque no se marque en esta
                  lista.
                </p>
              </div>
            </div>
          </AdminSection>

          <AdminSection
            icon={CheckCircle2}
            eyebrow="Contenido público"
            title="Ficha del vehículo"
            description="Información descriptiva que se mostrará en el detalle público de la unidad."
          >
            <div className="grid gap-5">
              <AdminInput
                label="Especificaciones rápidas"
                name="specs"
                placeholder="689 cc, ABS, dos cilindros..."
                description="Sepáralas por comas o saltos de línea."
              />

              <AdminTextarea
                label="Características principales"
                name="features"
                rows={4}
                placeholder="Cámara 360, pantalla central, control de tracción..."
                description="Puede heredarse del modelo comercial seleccionado."
              />

              <AdminTextarea
                label="Descripción"
                name="description"
                rows={5}
                placeholder="Descripción comercial del vehículo..."
                description="Puede heredarse del modelo comercial seleccionado."
              />
            </div>
          </AdminSection>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-5">
            <AdminSection
              icon={Eye}
              eyebrow="Visibilidad"
              title="Publicación"
              description="Configura la condición, estado y ubicación pública de la unidad."
              contentClassName="p-5"
            >
              <div className="grid gap-4">
                <AdminSelect
                  label="Condición"
                  name="condition"
                  defaultValue={
                    VehicleCondition.NUEVO
                  }
                >
                  <option
                    value={
                      VehicleCondition.NUEVO
                    }
                  >
                    Nuevo
                  </option>

                  <option
                    value={
                      VehicleCondition.SEMINUEVO
                    }
                  >
                    Seminuevo
                  </option>
                </AdminSelect>

                <AdminSelect
                  label="Estado"
                  name="status"
                  defaultValue={
                    VehicleStatus.DISPONIBLE
                  }
                >
                  <option
                    value={
                      VehicleStatus.DISPONIBLE
                    }
                  >
                    Disponible
                  </option>

                  <option
                    value={
                      VehicleStatus.APARTADO
                    }
                  >
                    Apartado
                  </option>

                  <option
                    value={
                      VehicleStatus.VENDIDO
                    }
                  >
                    Vendido
                  </option>

                  <option
                    value={
                      VehicleStatus.EN_TRANSITO
                    }
                  >
                    En tránsito
                  </option>

                  <option
                    value={
                      VehicleStatus.PROXIMAMENTE
                    }
                  >
                    Próximamente
                  </option>

                  <option
                    value={
                      VehicleStatus.INACTIVO
                    }
                  >
                    Inactivo
                  </option>
                </AdminSelect>

                <AdminToggleOption
                  name="active"
                  title="Visible en el sitio"
                  description="Cuando está desactivado, no se muestra públicamente."
                  icon={Eye}
                  defaultChecked
                />

                <AdminToggleOption
                  name="isFeatured"
                  title="Unidad destacada"
                  description="Podrá mostrarse en carruseles y secciones principales."
                  icon={Star}
                />
              </div>
            </AdminSection>

            <AdminSection
              icon={ImageIcon}
              eyebrow="Multimedia"
              title="Galería"
              description="Carga fotografías o videos reales de la unidad."
              contentClassName="p-5"
            >
              <div className="grid gap-5">
                <AdminInput
                  label="Imagen principal externa"
                  name="mainImage"
                  placeholder="https://... o /uploads/..."
                  description="Se utilizará cuando no se cargue una fotografía local."
                />

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Archivos
                  </span>

                  <div className="rounded-[16px] border border-dashed border-slate-300 bg-[#f8fafb] p-4">
                    <Upload
                      size={25}
                      className="mx-auto text-[#192a3a]"
                    />

                    <p className="mt-3 text-center text-xs font-black text-slate-700">
                      Fotos y videos
                    </p>

                    <p className="mt-1 text-center text-xs leading-5 text-slate-500">
                      Los archivos cargados
                      reemplazarán la galería
                      heredada del modelo base.
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
                    JPG, PNG, WEBP, AVIF,
                    MP4, WEBM o MOV.
                  </span>
                </label>
              </div>
            </AdminSection>

            <AdminAlert variant="success">
              <p className="font-black">
                Regla de publicación
              </p>

              <p className="mt-1 text-xs leading-5">
                Nuevo + Disponible + Visible
                aparece en catálogo. Seminuevo
                + Disponible + Visible aparece
                en inventario.
              </p>
            </AdminAlert>

            <section className="rounded-[22px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
              >
                <Save size={17} />
                Guardar vehículo
              </button>

              <Link
                href="/admin/inventario"
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
              >
                Cancelar
              </Link>
            </section>

            <section className="rounded-[22px] border border-[#192a3a]/10 bg-[#e7edf1] p-5">
              <Sparkles
                size={20}
                className="text-[#192a3a]"
              />

              <p className="mt-3 text-sm font-black text-[#192a3a]">
                Modelo base
              </p>

              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                Al elegir un modelo comercial,
                el formulario puede heredar año,
                precio, descripción,
                especificaciones e imágenes.
              </p>
            </section>

            <section className="rounded-[22px] border border-black/[0.08] bg-white p-5">
              <div className="flex items-start gap-3">
                <Gauge
                  size={18}
                  className="mt-0.5 shrink-0 text-[#192a3a]"
                />

                <p className="text-xs font-semibold leading-5 text-slate-500">
                  Para seminuevos registra el
                  kilometraje real. En unidades
                  nuevas puede mantenerse en cero.
                </p>
              </div>
            </section>
          </div>
        </aside>
      </form>
    </div>
  );
}