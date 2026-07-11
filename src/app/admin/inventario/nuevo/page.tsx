import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  AlertCircle,
  ArrowLeft,
  Car,
  CheckCircle2,
  Eye,
  ImageIcon,
  Info,
  MapPin,
  Save,
  Sparkles,
  Star,
  Store,
  Upload,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleCondition,
  VehicleMediaType,
  VehicleStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { saveVehicleMediaFiles } from "@/lib/uploads";
import { BrandCategorySelects } from "@/components/admin/catalog/BrandCategorySelects";

export const dynamic = "force-dynamic";

type NewVehiclePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getNumberValue(
  formData: FormData,
  fieldName: string
) {
  const value = Number(
    formData.get(fieldName)
  );

  return Number.isFinite(value)
    ? value
    : 0;
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

function parseCatalogImages(
  formData: FormData
) {
  const rawValue = String(
    formData.get("catalogImages") ?? ""
  ).trim();

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
          !item ||
          typeof item !== "object"
        ) {
          return null;
        }

        const record = item as {
          url?: unknown;
          type?: unknown;
          alt?: unknown;
        };

        const url =
          typeof record.url === "string"
            ? record.url.trim()
            : "";

        if (!url) {
          return null;
        }

        const type =
          record.type ===
            VehicleMediaType.VIDEO
            ? VehicleMediaType.VIDEO
            : VehicleMediaType.IMAGE;

        const alt =
          typeof record.alt === "string"
            ? record.alt.trim() || null
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
        ): item is NonNullable<
          typeof item
        > => Boolean(item)
      );
  } catch {
    return [];
  }
}

function redirectWithError(
  message: string
): never {
  redirect(
    `/admin/inventario/nuevo?error=${encodeURIComponent(
      message
    )}`
  );
}

async function createVehicle(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const condition: VehicleCondition =
    formData.get("condition") ===
      VehicleCondition.SEMINUEVO
      ? VehicleCondition.SEMINUEVO
      : VehicleCondition.NUEVO;

  const statusValue = String(
    formData.get("status") ||
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

  const status =
    validStatuses.includes(
      statusValue as VehicleStatus
    )
      ? (statusValue as VehicleStatus)
      : VehicleStatus.DISPONIBLE;

  const categoryValue = String(
    formData.get("category") ||
    VehicleCategory.AUTO
  );

  const validCategories: VehicleCategory[] =
    [
      VehicleCategory.AUTO,
      VehicleCategory.MOTO,
      VehicleCategory.TODOTERRENO,
    ];

  const category =
    validCategories.includes(
      categoryValue as VehicleCategory
    )
      ? (categoryValue as VehicleCategory)
      : VehicleCategory.AUTO;

  const active =
    formData.get("active") === "on";

  const isFeatured =
    formData.get("isFeatured") === "on";

  const brandId = getNumberValue(
    formData,
    "brandId"
  );

  const branchId = getNumberValue(
    formData,
    "branchId"
  );

  const availabilityBranchIds =
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
      new Set(
        [
          branchId,
          ...availabilityBranchIds,
        ].filter(Boolean)
      )
    );

  const year =
    getOptionalNumberValue(
      formData,
      "year"
    ) ??
    getOptionalNumberValue(
      formData,
      "catalogYear"
    ) ??
    0;

  const price =
    getOptionalNumberValue(
      formData,
      "price"
    ) ??
    getOptionalNumberValue(
      formData,
      "catalogPriceFrom"
    ) ??
    0;

  const mileage =
    getOptionalNumberValue(
      formData,
      "mileage"
    );

  const name = String(
    formData.get("name") || ""
  ).trim();

  const model = String(
    formData.get("model") || name
  ).trim();

  const type = String(
    formData.get("type") ||
    category ||
    "General"
  ).trim();

  const specs = String(
    formData.get("specs") ||
    formData.get("catalogSpecs") ||
    ""
  ).trim();

  const features = String(
    formData.get("features") ||
    formData.get(
      "catalogFeatures"
    ) ||
    ""
  ).trim();

  const description = String(
    formData.get("description") ||
    formData.get(
      "catalogDescription"
    ) ||
    ""
  ).trim();

  const mainImageInput = String(
    formData.get("mainImage") ||
    formData.get(
      "catalogMainImage"
    ) ||
    ""
  ).trim();

  if (!brandId) {
    redirectWithError(
      "Selecciona una marca para la unidad."
    );
  }

  if (!branchId) {
    redirectWithError(
      "Selecciona una sucursal principal."
    );
  }

  if (!name || !model || !type) {
    redirectWithError(
      "Faltan los datos principales del vehículo."
    );
  }

  if (
    !Number.isFinite(year) ||
    year < 1900 ||
    year > 2100
  ) {
    redirectWithError(
      "El año del vehículo no es válido."
    );
  }

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    redirectWithError(
      "El precio del vehículo no es válido."
    );
  }

  if (
    mileage !== null &&
    (!Number.isFinite(mileage) ||
      mileage < 0)
  ) {
    redirectWithError(
      "El kilometraje del vehículo no es válido."
    );
  }

  const [brand, branch] =
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

      prisma.branch.findUnique({
        where: {
          id: branchId,
        },

        select: {
          id: true,
          active: true,
        },
      }),
    ]);

  if (!brand) {
    redirectWithError(
      "La marca seleccionada ya no existe."
    );
  }

  if (!branch) {
    redirectWithError(
      "La sucursal seleccionada ya no existe."
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
      "Error guardando archivos del vehículo:",
      error
    );

    redirectWithError(
      error instanceof Error
        ? error.message
        : "No se pudieron guardar los archivos del vehículo."
    );
  }

  /*
   * Este cálculo debe realizarse después
   * de guardar los archivos.
   */
  const catalogImages =
    parseCatalogImages(formData);

  const finalGalleryMedia =
    savedMedia.length > 0
      ? savedMedia
      : catalogImages;

  const firstUploadedImage =
    savedMedia.find(
      (item) =>
        item.type ===
        VehicleMediaType.IMAGE
    );

  const firstCatalogImage =
    catalogImages.find(
      (item) =>
        item.type ===
        VehicleMediaType.IMAGE
    );

  const finalMainImage =
    firstUploadedImage?.url ||
    mainImageInput ||
    firstCatalogImage?.url ||
    "";

  const vehicle =
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
        mainImage: finalMainImage,
        active,
        isFeatured,

        images:
          finalGalleryMedia.length > 0
            ? {
              create:
                finalGalleryMedia.map(
                  (item, index) => ({
                    url: item.url,
                    type: item.type,

                    alt:
                      "alt" in item &&
                        typeof item.alt ===
                        "string" &&
                        item.alt.trim()
                        ? item.alt.trim()
                        : name,

                    order: index,
                  })
                ),
            }
            : undefined,

        branchAvailabilities: {
          create: uniqueBranchIds.map(
            (availabilityBranchId) => ({
              branchId:
                availabilityBranchId,
            })
          ),
        },
      },
    });

  revalidatePath("/admin");
  revalidatePath(
    "/admin/inventario"
  );
  revalidatePath(
    "/admin/inventario/salud"
  );
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(
    `/vehiculos/${vehicle.id}`
  );

  redirect(
    `/admin/inventario?success=${encodeURIComponent(
      "Unidad registrada correctamente."
    )}`
  );
}

export default async function NewVehiclePage({
  searchParams,
}: NewVehiclePageProps) {
  await requireAdmin();

  const params = await searchParams;

  const currentYear =
    new Date().getFullYear();

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

      orderBy: {
        name: "asc",
      },
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

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative">
          <Link
            href="/admin/inventario"
            className="inline-flex items-center gap-2 text-xs font-black text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Volver al inventario
          </Link>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
            <Car size={15} />
            Inventario de unidades
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
            Registrar vehículo
          </h1>

          <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-white/60 md:text-base">
            Crea una unidad nueva o
            seminueva, asigna su sucursal,
            información comercial, galería y
            configuración de publicación.
          </p>
        </div>
      </section>

      {params.error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700"
        >
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>{params.error}</span>
        </div>
      )}

      {brands.length === 0 && (
        <div className="mt-5 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-800">
            No hay marcas activas
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-700">
            Debes registrar o activar una
            marca antes de crear una unidad.
          </p>

          <Link
            href="/admin/marcas"
            className="mt-3 inline-flex text-xs font-black text-amber-800 underline"
          >
            Ir a marcas
          </Link>
        </div>
      )}

      {branches.length === 0 && (
        <div className="mt-5 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-800">
            No hay sucursales activas
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-700">
            Debes registrar o activar una
            sucursal antes de crear una unidad.
          </p>

          <Link
            href="/admin/sucursales"
            className="mt-3 inline-flex text-xs font-black text-amber-800 underline"
          >
            Ir a sucursales
          </Link>
        </div>
      )}

      <form
        action={createVehicle}
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="space-y-6">
          {/* Marca y modelo */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Sparkles}
              eyebrow="Plantilla comercial"
              title="Marca, categoría y modelo"
              description="Selecciona un modelo del catálogo para completar automáticamente la información disponible."
            />

            <div className="p-5 md:p-6">
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
                          order:
                            image.order,
                        })
                      ),
                  })
                )}
              />
            </div>
          </section>

          {/* Datos comerciales */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Car}
              eyebrow="Información comercial"
              title="Datos de la unidad"
              description="Captura año, precio y kilometraje de esta unidad real."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
              <FormInput
                label="Año"
                name="year"
                type="number"
                required
                min={1900}
                max={2100}
                defaultValue={
                  currentYear
                }
                description="Puede completarse desde el modelo base."
              />

              <FormInput
                label="Precio"
                name="price"
                type="number"
                required
                min={0}
                placeholder="Ej. 799000"
                description="Captura el precio final de esta unidad."
              />

              <div className="md:col-span-2">
                <FormInput
                  label="Kilometraje"
                  name="mileage"
                  type="number"
                  min={0}
                  placeholder="Ej. 0"
                  description="Para vehículos nuevos puede permanecer vacío o en cero."
                />
              </div>
            </div>
          </section>

          {/* Sucursales */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={MapPin}
              eyebrow="Ubicación"
              title="Sucursal y disponibilidad"
              description="Selecciona la ubicación principal y las demás sucursales donde también estará disponible."
            />

            <div className="grid gap-6 p-5 md:p-6">
              <FormSelect
                label="Sucursal principal"
                name="branchId"
                required
                description="Esta sucursal será la ubicación principal del vehículo."
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
              </FormSelect>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Disponible también en
                </p>

                <div className="mt-3 grid gap-3 rounded-[18px] border border-slate-200 bg-[#f8fafb] p-4 md:grid-cols-2">
                  {branches.map(
                    (branch) => (
                      <label
                        key={branch.id}
                        className="flex cursor-pointer items-start gap-3 rounded-[15px] border border-slate-100 bg-white p-4 transition hover:border-[#192a3a]/25"
                      >
                        <input
                          type="checkbox"
                          name="branchIds"
                          value={branch.id}
                          className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-[#192a3a]"
                        />

                        <span>
                          <span className="block text-sm font-black text-[#192a3a]">
                            {branch.name}
                          </span>

                          <span className="mt-1 block text-xs font-semibold text-slate-500">
                            {branch.city},{" "}
                            {branch.state}
                          </span>
                        </span>
                      </label>
                    )
                  )}
                </div>

                <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <Info size={14} />
                  La sucursal principal se
                  agrega automáticamente.
                </p>
              </div>
            </div>
          </section>

          {/* Ficha pública */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={CheckCircle2}
              eyebrow="Información pública"
              title="Ficha del vehículo"
              description="Completa la información que verá el visitante en la página de detalle."
            />

            <div className="grid gap-5 p-5 md:p-6">
              <FormInput
                label="Especificaciones rápidas"
                name="specs"
                placeholder="Ej. 689 cc, ABS, 2 cilindros"
                description="Separa cada especificación utilizando comas."
              />

              <FormTextarea
                label="Características principales"
                name="features"
                rows={4}
                placeholder="Ej. Cámara 360, control de tracción, pantalla central..."
              />

              <FormTextarea
                label="Descripción comercial"
                name="description"
                rows={6}
                placeholder="Describe la unidad, sus beneficios y características principales..."
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
                      Define su condición,
                      estado y visibilidad.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5">
                <FormSelect
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
                </FormSelect>

                <FormSelect
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
                </FormSelect>

                <ToggleOption
                  name="active"
                  title="Visible en el sitio"
                  description="La unidad podrá mostrarse en las páginas públicas."
                  icon={Eye}
                  defaultChecked
                />

                <ToggleOption
                  name="isFeatured"
                  title="Unidad destacada"
                  description="Podrá mostrarse en secciones principales del sitio."
                  icon={Star}
                />
              </div>
            </section>

            {/* Galería */}
            <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 bg-[#f8fafb] p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7edf1] text-[#192a3a]">
                    <ImageIcon size={18} />
                  </span>

                  <div>
                    <h2 className="text-xl font-black">
                      Galería
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Sube fotografías o
                      videos reales.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5">
                <FormInput
                  label="Imagen externa"
                  name="mainImage"
                  placeholder="https://..."
                  description="Opcional. La primera imagen subida tendrá prioridad."
                />

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Archivos
                  </span>

                  <div className="rounded-[16px] border border-dashed border-slate-300 bg-[#f8fafb] p-4">
                    <Upload
                      size={24}
                      className="mx-auto text-[#192a3a]"
                    />

                    <p className="mt-3 text-center text-xs font-black text-slate-700">
                      Selecciona imágenes o
                      videos
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
                    Hasta 10 archivos: JPG,
                    PNG, WEBP, AVIF, MP4,
                    WEBM o MOV.
                  </span>
                </label>
              </div>
            </section>

            {/* Resumen y envío */}
            <section className="rounded-[22px] border border-[#192a3a]/10 bg-[#e7edf1] p-5">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#192a3a]">
                  <Store size={18} />
                </span>

                <div>
                  <p className="text-sm font-black text-[#192a3a]">
                    Regla de publicación
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Nuevo, disponible y
                    visible aparece en
                    catálogo. Seminuevo,
                    disponible y visible
                    aparece en inventario.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  brands.length === 0 ||
                  branches.length === 0
                }
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                Guardar vehículo
              </button>

              <Link
                href="/admin/inventario"
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#192a3a]/15 bg-white px-5 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#f8fafb] active:scale-[0.98]"
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

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: typeof Car;
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
  required = false,
  defaultValue,
  description,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      >
        {children}
      </select>

      {description && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}
    </label>
  );
}

function FormTextarea({
  label,
  name,
  rows,
  placeholder,
}: {
  label: string;
  name: string;
  rows: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      />
    </label>
  );
}

function ToggleOption({
  name,
  title,
  description,
  icon: Icon,
  defaultChecked = false,
}: {
  name: string;
  title: string;
  description: string;
  icon: typeof Eye;
  defaultChecked?: boolean;
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