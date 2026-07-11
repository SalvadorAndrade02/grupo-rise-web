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
  BadgeCheck,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Eye,
  EyeOff,
  ImageIcon,
  Info,
  MapPin,
  Save,
  Star,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleCondition,
  VehicleMediaType,
  VehicleStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  deletePublicFile,
  saveVehicleMediaFiles,
} from "@/lib/uploads";

export const dynamic = "force-dynamic";

type EditVehiclePageProps = {
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

const validConditions: VehicleCondition[] = [
  VehicleCondition.NUEVO,
  VehicleCondition.SEMINUEVO,
];

const validStatuses: VehicleStatus[] = [
  VehicleStatus.DISPONIBLE,
  VehicleStatus.APARTADO,
  VehicleStatus.VENDIDO,
  VehicleStatus.EN_TRANSITO,
  VehicleStatus.PROXIMAMENTE,
  VehicleStatus.INACTIVO,
];

function getStringValue(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) || ""
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

function parseCategory(
  value: FormDataEntryValue | null,
  fallback: VehicleCategory
): VehicleCategory {
  return validCategories.includes(
    value as VehicleCategory
  )
    ? (value as VehicleCategory)
    : fallback;
}

function parseCondition(
  value: FormDataEntryValue | null,
  fallback: VehicleCondition
): VehicleCondition {
  return validConditions.includes(
    value as VehicleCondition
  )
    ? (value as VehicleCondition)
    : fallback;
}

function parseStatus(
  value: FormDataEntryValue | null,
  fallback: VehicleStatus
): VehicleStatus {
  return validStatuses.includes(
    value as VehicleStatus
  )
    ? (value as VehicleStatus)
    : fallback;
}

function getCategoryLabel(
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

function getConditionLabel(
  condition: VehicleCondition
) {
  const labels: Record<
    VehicleCondition,
    string
  > = {
    NUEVO: "Nuevo",
    SEMINUEVO: "Seminuevo",
  };

  return labels[condition];
}

function getStatusLabel(
  status: VehicleStatus
) {
  const labels: Record<
    VehicleStatus,
    string
  > = {
    DISPONIBLE: "Disponible",
    APARTADO: "Apartado",
    VENDIDO: "Vendido",
    EN_TRANSITO: "En tránsito",
    PROXIMAMENTE: "Próximamente",
    INACTIVO: "Inactivo",
  };

  return labels[status];
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function redirectEditError(
  vehicleId: number,
  message: string
): never {
  redirect(
    `/admin/inventario/${vehicleId}/editar?error=${encodeURIComponent(
      message
    )}`
  );
}

function revalidateVehiclePaths(
  vehicleId: number
) {
  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
  revalidatePath(
    "/admin/inventario/salud"
  );
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(
    `/vehiculos/${vehicleId}`
  );
}

async function updateVehicle(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const vehicleId = Number(
    formData.get("vehicleId")
  );

  if (!vehicleId) {
    redirect(
      `/admin/inventario?error=${encodeURIComponent(
        "No se pudo identificar el vehículo."
      )}`
    );
  }

  const currentVehicle =
    await prisma.vehicle.findUnique({
      where: {
        id: vehicleId,
      },

      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

  if (!currentVehicle) {
    redirect(
      `/admin/inventario?error=${encodeURIComponent(
        "El vehículo ya no existe."
      )}`
    );
  }

  const brandId = Number(
    formData.get("brandId")
  );

  const branchId = Number(
    formData.get("branchId")
  );

  const name = getStringValue(
    formData,
    "name"
  );

  const model =
    getStringValue(formData, "model") ||
    name;

  const category = parseCategory(
    formData.get("category"),
    currentVehicle.category
  );

  const condition = parseCondition(
    formData.get("condition"),
    currentVehicle.condition
  );

  const status = parseStatus(
    formData.get("status"),
    currentVehicle.status
  );

  const year =
    getOptionalNumberValue(
      formData,
      "year"
    ) ?? currentVehicle.year;

  const price =
    getOptionalNumberValue(
      formData,
      "price"
    ) ?? currentVehicle.price;

  const mileage =
    getOptionalNumberValue(
      formData,
      "mileage"
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

  const mainImageUrl = getStringValue(
    formData,
    "mainImageUrl"
  );

  const active =
    formData.get("active") === "on";

  const isFeatured =
    formData.get("isFeatured") === "on";

  if (
    !brandId ||
    !branchId ||
    !name ||
    !model
  ) {
    redirectEditError(
      vehicleId,
      "Selecciona marca, sucursal y captura el nombre de la unidad."
    );
  }

  if (
    !Number.isFinite(year) ||
    year < 1900 ||
    year > 2100
  ) {
    redirectEditError(
      vehicleId,
      "El año del vehículo no es válido."
    );
  }

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    redirectEditError(
      vehicleId,
      "El precio del vehículo no es válido."
    );
  }

  if (
    mileage !== null &&
    (!Number.isFinite(mileage) ||
      mileage < 0)
  ) {
    redirectEditError(
      vehicleId,
      "El kilometraje no es válido."
    );
  }

  const selectedBranchIds = formData
    .getAll("branchIds")
    .map((value) => Number(value))
    .filter(
      (value) =>
        Number.isInteger(value) &&
        value > 0
    );

  const uniqueBranchIds = Array.from(
    new Set([
      branchId,
      ...selectedBranchIds,
    ])
  );

  const [
    selectedBrand,
    selectedBranch,
    validBranchCount,
  ] = await Promise.all([
    prisma.brand.findUnique({
      where: {
        id: brandId,
      },

      select: {
        id: true,
      },
    }),

    prisma.branch.findUnique({
      where: {
        id: branchId,
      },

      select: {
        id: true,
      },
    }),

    prisma.branch.count({
      where: {
        id: {
          in: uniqueBranchIds,
        },
      },
    }),
  ]);

  if (!selectedBrand) {
    redirectEditError(
      vehicleId,
      "La marca seleccionada ya no existe."
    );
  }

  if (!selectedBranch) {
    redirectEditError(
      vehicleId,
      "La sucursal seleccionada ya no existe."
    );
  }

  if (
    validBranchCount !==
    uniqueBranchIds.length
  ) {
    redirectEditError(
      vehicleId,
      "Una de las sucursales seleccionadas ya no existe."
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

    redirectEditError(
      vehicleId,
      error instanceof Error
        ? error.message
        : "No se pudieron guardar los archivos del vehículo."
    );
  }

  const currentHighestOrder =
    currentVehicle.images.reduce(
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
    currentVehicle.images.find(
      (item) =>
        item.type ===
        VehicleMediaType.IMAGE
    );

  const finalMainImage =
    mainImageUrl ||
    currentVehicle.mainImage ||
    firstExistingImage?.url ||
    firstUploadedImage?.url ||
    "";

  try {
    await prisma.vehicle.update({
      where: {
        id: vehicleId,
      },

      data: {
        brandId,
        branchId,
        name,
        model,
        type: category,
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

        branchAvailabilities: {
          deleteMany: {},

          create: uniqueBranchIds.map(
            (availabilityBranchId) => ({
              branchId:
                availabilityBranchId,
            })
          ),
        },
      },
    });
  } catch (error) {
    for (const item of savedMedia) {
      if (
        item.url.startsWith("/uploads/")
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
      "Error actualizando vehículo:",
      error
    );

    redirectEditError(
      vehicleId,
      "No se pudieron guardar los cambios del vehículo."
    );
  }

  revalidateVehiclePaths(vehicleId);

  redirect(
    `/admin/inventario/${vehicleId}/editar?success=${encodeURIComponent(
      "Vehículo actualizado correctamente."
    )}`
  );
}

async function setVehicleMainImage(
  vehicleId: number,
  imageId: number
) {
  "use server";

  await requireAdmin();

  if (!vehicleId || !imageId) {
    return;
  }

  const image =
    await prisma.vehicleImage.findUnique({
      where: {
        id: imageId,
      },
    });

  if (
    !image ||
    image.vehicleId !== vehicleId
  ) {
    redirectEditError(
      vehicleId,
      "No se pudo identificar la imagen."
    );
  }

  if (
    image.type !==
    VehicleMediaType.IMAGE
  ) {
    redirectEditError(
      vehicleId,
      "Un video no puede utilizarse como imagen principal."
    );
  }

  const images =
    await prisma.vehicleImage.findMany({
      where: {
        vehicleId,
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
    prisma.vehicle.update({
      where: {
        id: vehicleId,
      },

      data: {
        mainImage: image.url,
      },
    }),

    ...reorderedImages.map(
      (item, index) =>
        prisma.vehicleImage.update({
          where: {
            id: item.id,
          },

          data: {
            order: index,
          },
        })
    ),
  ]);

  revalidateVehiclePaths(vehicleId);

  redirect(
    `/admin/inventario/${vehicleId}/editar?success=${encodeURIComponent(
      "Imagen principal actualizada."
    )}`
  );
}

async function deleteVehicleImage(
  vehicleId: number,
  imageId: number
) {
  "use server";

  await requireAdmin();

  if (!vehicleId || !imageId) {
    return;
  }

  const image =
    await prisma.vehicleImage.findUnique({
      where: {
        id: imageId,
      },

      include: {
        vehicle: {
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
    image.vehicleId !== vehicleId
  ) {
    redirectEditError(
      vehicleId,
      "No se pudo identificar el archivo."
    );
  }

  const remainingImages =
    image.vehicle.images.filter(
      (item) => item.id !== image.id
    );

  const isCurrentMainImage =
    image.vehicle.mainImage === image.url;

  const nextMainImage =
    isCurrentMainImage
      ? remainingImages.find(
        (item) =>
          item.type ===
          VehicleMediaType.IMAGE
      )?.url ?? ""
      : image.vehicle.mainImage;

  await prisma.$transaction([
    prisma.vehicleImage.delete({
      where: {
        id: imageId,
      },
    }),

    prisma.vehicle.update({
      where: {
        id: vehicleId,
      },

      data: {
        mainImage: nextMainImage,
      },
    }),

    ...remainingImages.map(
      (item, index) =>
        prisma.vehicleImage.update({
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

  revalidateVehiclePaths(vehicleId);

  redirect(
    `/admin/inventario/${vehicleId}/editar?success=${encodeURIComponent(
      image.type ===
        VehicleMediaType.VIDEO
        ? "Video eliminado correctamente."
        : "Imagen eliminada correctamente."
    )}`
  );
}

export default async function EditVehiclePage({
  params,
  searchParams,
}: EditVehiclePageProps) {
  await requireAdmin();

  const { id } = await params;
  const query = await searchParams;

  const vehicleId = Number(id);

  if (!vehicleId) {
    notFound();
  }

  const vehicle =
    await prisma.vehicle.findUnique({
      where: {
        id: vehicleId,
      },

      include: {
        brand: true,
        branch: true,

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

        branchAvailabilities: {
          include: {
            branch: true,
          },
        },
      },
    });

  if (!vehicle) {
    notFound();
  }

  const [brands, branches] =
    await Promise.all([
      prisma.brand.findMany({
        where: {
          OR: [
            {
              active: true,
            },
            {
              id: vehicle.brandId,
            },
          ],
        },

        orderBy: {
          name: "asc",
        },
      }),

      prisma.branch.findMany({
        where: {
          OR: [
            {
              active: true,
            },
            {
              id: vehicle.branchId,
            },
            {
              id: {
                in:
                  vehicle.branchAvailabilities.map(
                    (item) =>
                      item.branchId
                  ),
              },
            },
          ],
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
    vehicle.mainImage ||
    vehicle.images.find(
      (image) =>
        image.type ===
        VehicleMediaType.IMAGE
    )?.url ||
    "";

  const selectedBranchIds = new Set(
    vehicle.branchAvailabilities.map(
      (item) => item.branchId
    )
  );

  selectedBranchIds.add(
    vehicle.branchId
  );

  const isPublic =
    vehicle.active &&
    vehicle.status ===
    VehicleStatus.DISPONIBLE &&
    vehicle.brand.active &&
    vehicle.branch.active;

  const publicRoute = isPublic
    ? `/vehiculos/${vehicle.id}`
    : null;

  const imageCount =
    vehicle.images.filter(
      (image) =>
        image.type ===
        VehicleMediaType.IMAGE
    ).length;

  const videoCount =
    vehicle.images.filter(
      (image) =>
        image.type ===
        VehicleMediaType.VIDEO
    ).length;

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <Link
              href="/admin/inventario"
              className="inline-flex items-center gap-2 text-xs font-black text-white/60 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Volver al inventario
            </Link>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
              <Car size={15} />
              Unidad #{vehicle.id}
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
              {vehicle.brand.name}{" "}
              {vehicle.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              Actualiza datos comerciales,
              publicación, sucursales y galería de
              esta unidad.
            </p>
          </div>

          {publicRoute ? (
            <Link
              href={publicRoute}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              <Eye size={17} />
              Ver en el sitio
            </Link>
          ) : (
            <span className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white/60">
              <EyeOff size={17} />
              No publicada
            </span>
          )}
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
          icon={Car}
          label="Condición"
          value={getConditionLabel(
            vehicle.condition
          )}
        />

        <SummaryCard
          icon={BadgeCheck}
          label="Estado"
          value={getStatusLabel(
            vehicle.status
          )}
        />

        <SummaryCard
          icon={Building2}
          label="Sucursal"
          value={vehicle.branch.name}
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
        action={updateVehicle}
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]"
      >
        <input
          type="hidden"
          name="vehicleId"
          value={vehicle.id}
        />

        <div className="space-y-6">
          {/* Información principal */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Car}
              eyebrow="Información principal"
              title="Datos de la unidad"
              description="Modifica la marca, modelo, categoría y datos comerciales."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
              <FormSelect
                label="Marca"
                name="brandId"
                defaultValue={String(
                  vehicle.brandId
                )}
                required
              >
                {brands.map((brand) => (
                  <option
                    key={brand.id}
                    value={brand.id}
                  >
                    {brand.name}
                    {!brand.active
                      ? " · Inactiva"
                      : ""}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="Sucursal principal"
                name="branchId"
                defaultValue={String(
                  vehicle.branchId
                )}
                required
              >
                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name}
                    {!branch.active
                      ? " · Inactiva"
                      : ""}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                label="Nombre de la unidad"
                name="name"
                defaultValue={vehicle.name}
                required
              />

              <FormInput
                label="Modelo"
                name="model"
                defaultValue={vehicle.model}
                required
              />

              <FormSelect
                label="Categoría"
                name="category"
                defaultValue={
                  vehicle.category
                }
                description="El campo interno de tipo se sincroniza con esta categoría."
              >
                {validCategories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {getCategoryLabel(
                        category
                      )}
                    </option>
                  )
                )}
              </FormSelect>

              <FormSelect
                label="Condición"
                name="condition"
                defaultValue={
                  vehicle.condition
                }
              >
                {validConditions.map(
                  (condition) => (
                    <option
                      key={condition}
                      value={condition}
                    >
                      {getConditionLabel(
                        condition
                      )}
                    </option>
                  )
                )}
              </FormSelect>

              <FormSelect
                label="Estado"
                name="status"
                defaultValue={vehicle.status}
              >
                {validStatuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {getStatusLabel(
                        status
                      )}
                    </option>
                  )
                )}
              </FormSelect>

              <FormInput
                label="Año"
                name="year"
                type="number"
                min={1900}
                max={2100}
                defaultValue={vehicle.year}
                required
              />

              <FormInput
                label="Precio"
                name="price"
                type="number"
                min={0}
                defaultValue={vehicle.price}
                required
                description={`Precio actual: ${formatMoney(
                  vehicle.price
                )}`}
              />

              <FormInput
                label="Kilometraje"
                name="mileage"
                type="number"
                min={0}
                defaultValue={
                  vehicle.mileage ?? ""
                }
              />
            </div>
          </section>

          {/* Ficha pública */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={CheckCircle2}
              eyebrow="Información pública"
              title="Descripción y atributos"
              description="Actualiza el contenido que se muestra en el detalle público."
            />

            <div className="grid gap-5 p-5 md:p-6">
              <FormTextarea
                label="Descripción"
                name="description"
                rows={6}
                defaultValue={
                  vehicle.description ?? ""
                }
              />

              <FormTextarea
                label="Especificaciones rápidas"
                name="specs"
                rows={4}
                defaultValue={
                  vehicle.specs ?? ""
                }
                description="Separa cada especificación utilizando comas."
              />

              <FormTextarea
                label="Características principales"
                name="features"
                rows={4}
                defaultValue={
                  vehicle.features ?? ""
                }
              />
            </div>
          </section>

          {/* Disponibilidad */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={MapPin}
              eyebrow="Disponibilidad"
              title="Sucursales relacionadas"
              description="Selecciona las ubicaciones donde esta unidad puede ofrecerse."
            />

            <div className="p-5 md:p-6">
              <div className="grid gap-3 md:grid-cols-2">
                {branches.map((branch) => (
                  <label
                    key={branch.id}
                    className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-slate-200 bg-[#f8fafb] p-4 transition hover:border-[#192a3a]/25 hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      name="branchIds"
                      value={branch.id}
                      defaultChecked={selectedBranchIds.has(
                        branch.id
                      )}
                      className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-[#192a3a]"
                    />

                    <span>
                      <span className="block text-sm font-black text-[#192a3a]">
                        {branch.name}
                      </span>

                      <span className="mt-1 block text-xs font-semibold text-slate-500">
                        {branch.city},{" "}
                        {branch.state}
                        {!branch.active
                          ? " · Inactiva"
                          : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Info size={14} />
                La sucursal principal se incluirá
                automáticamente.
              </p>
            </div>
          </section>
        </div>

        {/* Lateral */}
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
                      Controla la visibilidad y
                      prioridad de la unidad.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <div className="rounded-[16px] border border-slate-100 bg-[#f8fafb] p-4">
                  <PublicationDetail
                    icon={Car}
                    value={getConditionLabel(
                      vehicle.condition
                    )}
                  />

                  <PublicationDetail
                    icon={CalendarDays}
                    value={String(
                      vehicle.year
                    )}
                  />

                  <PublicationDetail
                    icon={BadgeCheck}
                    value={getStatusLabel(
                      vehicle.status
                    )}
                  />
                </div>

                <ToggleOption
                  name="active"
                  title="Visible en el sitio"
                  description="También requiere estado disponible y relaciones activas."
                  icon={
                    vehicle.active
                      ? Eye
                      : EyeOff
                  }
                  defaultChecked={
                    vehicle.active
                  }
                />

                <ToggleOption
                  name="isFeatured"
                  title="Unidad destacada"
                  description="Puede aparecer en secciones principales del sitio."
                  icon={Star}
                  defaultChecked={
                    vehicle.isFeatured
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
                  href="/admin/inventario"
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
                      Vista actual de la unidad.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-slate-100">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={vehicle.name}
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
                      vehicle.mainImage ??
                      ""
                    }
                    placeholder="https://..."
                    description="Déjala vacía para conservar la imagen principal actual."
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
                    {vehicle.images.length} archivo
                    {vehicle.images.length === 1
                      ? ""
                      : "s"}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                {vehicle.images.length > 0 ? (
                  vehicle.images.map(
                    (image) => {
                      const isMain =
                        vehicle.mainImage ===
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
                                  vehicle.name
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
                                  formAction={setVehicleMainImage.bind(
                                    null,
                                    vehicle.id,
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
                              formAction={deleteVehicleImage.bind(
                                null,
                                vehicle.id,
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

function PublicationDetail({
  icon: Icon,
  value,
}: {
  icon: LucideIcon;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 py-2 text-xs font-black text-slate-700 last:border-b-0">
      <Icon
        size={15}
        className="text-[#192a3a]"
      />

      {value}
    </div>
  );
}