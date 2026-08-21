import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Car,
  Eye,
  EyeOff,
  Gauge,
  ImageIcon,
  MapPin,
  Save,
  Star,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import {
  Currency,
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
  VehicleCategory.NAUTICA
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

const validCurrencies: Currency[] = [
  Currency.MXN,
  Currency.USD,
];

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

function parseCategory(
  value: FormDataEntryValue | null,
  fallback: VehicleCategory
) {
  return validCategories.includes(
    value as VehicleCategory
  )
    ? (value as VehicleCategory)
    : fallback;
}

function parseCondition(
  value: FormDataEntryValue | null,
  fallback: VehicleCondition
) {
  return validConditions.includes(
    value as VehicleCondition
  )
    ? (value as VehicleCondition)
    : fallback;
}

function parseStatus(
  value: FormDataEntryValue | null,
  fallback: VehicleStatus
) {
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
    TODOTERRENO: "Todo terreno",
    NAUTICA: "Náutica"
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

function formatMoney(
  value: number,
  currency: Currency
) {
  const formatted =
    new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 0,
    }).format(value);

  return `$${formatted} ${currency}`;
}

function parseCurrency(
  value: FormDataEntryValue | null,
  fallback: Currency
) {
  return validCurrencies.includes(
    value as Currency
  )
    ? (value as Currency)
    : fallback;
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

  revalidatePath(
    `/admin/inventario/${vehicleId}/editar`
  );

  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(
    `/vehiculos/${vehicleId}`
  );
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

async function safelyDeleteUnreferencedFile(
  url?: string | null
) {
  if (
    !url ||
    !url.startsWith("/uploads/")
  ) {
    return;
  }

  const [
    vehicleReferences,
    catalogReferences,
  ] = await Promise.all([
    prisma.vehicleImage.count({
      where: {
        url,
      },
    }),

    prisma.catalogImage.count({
      where: {
        url,
      },
    }),
  ]);

  if (
    vehicleReferences > 0 ||
    catalogReferences > 0
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

async function updateVehicle(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const vehicleId =
    getPositiveIntegerValue(
      formData,
      "vehicleId"
    );

  if (!vehicleId) {
    redirect(
      `/admin/inventario?error=${encodeURIComponent(
        "El vehículo no es válido."
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

        branchAvailabilities: {
          select: {
            branchId: true,
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

  const name = getTextValue(
    formData,
    "name"
  );

  const model =
    getTextValue(
      formData,
      "model"
    ) || name;

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

  const currency =
    parseCurrency(
      formData.get("currency"),
      currentVehicle.currency
    );

  const mileage =
    getOptionalNumberValue(
      formData,
      "mileage"
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

  const mainImageUrl =
    getTextValue(
      formData,
      "mainImageUrl"
    );

  const active =
    formData.get("active") === "on";

  const isFeatured =
    formData.get("isFeatured") ===
    "on";

  if (
    !brandId ||
    !branchId ||
    !name ||
    !model
  ) {
    redirectVehicleError(
      vehicleId,
      "Selecciona marca, sucursal y captura el nombre de la unidad."
    );
  }

  if (name.length < 2) {
    redirectVehicleError(
      vehicleId,
      "El nombre de la unidad debe contener al menos dos caracteres."
    );
  }

  if (
    !Number.isInteger(year) ||
    year < 1900 ||
    year >
    new Date().getFullYear() + 3
  ) {
    redirectVehicleError(
      vehicleId,
      "El año del vehículo no es válido."
    );
  }

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    redirectVehicleError(
      vehicleId,
      "El precio del vehículo no es válido."
    );
  }

  if (
    mileage !== null &&
    (!Number.isInteger(mileage) ||
      mileage < 0)
  ) {
    redirectVehicleError(
      vehicleId,
      "El kilometraje debe ser un número entero igual o mayor a cero."
    );
  }

  if (
    !isValidMediaReference(
      mainImageUrl
    )
  ) {
    redirectVehicleError(
      vehicleId,
      "La referencia de la imagen principal no es válida."
    );
  }

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
    );

  const currentBranchIds = new Set([
    currentVehicle.branchId,

    ...currentVehicle.branchAvailabilities.map(
      (item) => item.branchId
    ),
  ]);

  const [brand, selectedBranches] =
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

      prisma.branch.findMany({
        where: {
          id: {
            in: uniqueBranchIds,
          },
        },

        select: {
          id: true,
          active: true,
        },
      }),
    ]);

  if (
    !brand ||
    (!brand.active &&
      brand.id !==
      currentVehicle.brandId)
  ) {
    redirectVehicleError(
      vehicleId,
      "La marca seleccionada no existe o está inactiva."
    );
  }

  if (
    brand.category !== category
  ) {
    redirectVehicleError(
      vehicleId,
      "La categoría seleccionada no coincide con la clasificación de la marca."
    );
  }

  if (
    selectedBranches.length !==
    uniqueBranchIds.length
  ) {
    redirectVehicleError(
      vehicleId,
      "Una de las sucursales seleccionadas ya no existe."
    );
  }

  const invalidBranch =
    selectedBranches.find(
      (branch) =>
        !branch.active &&
        !currentBranchIds.has(branch.id)
    );

  if (invalidBranch) {
    redirectVehicleError(
      vehicleId,
      "No puedes agregar una sucursal inactiva."
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
      vehicleId,
      error instanceof Error
        ? error.message
        : "No se pudieron guardar los archivos del vehículo."
    );
  }

  const currentHighestOrder =
    currentVehicle.images.reduce(
      (highest, image) =>
        Math.max(
          highest,
          image.order
        ),
      -1
    );

  const firstExistingImage =
    currentVehicle.images.find(
      (item) =>
        item.type ===
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
        currency,
        mileage,
        description,
        specs,
        features,
        mainImage:
          finalMainImage,
        active,
        isFeatured,

        images: savedMedia.length
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
    await safelyDeleteMedia(savedMedia);

    console.error(
      "Error actualizando vehículo:",
      error
    );

    redirectVehicleError(
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

  if (
    !Number.isInteger(vehicleId) ||
    vehicleId <= 0 ||
    !Number.isInteger(imageId) ||
    imageId <= 0
  ) {
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
    image.vehicleId !== vehicleId
  ) {
    redirectVehicleError(
      vehicleId,
      "No se pudo identificar la imagen."
    );
  }

  if (
    image.type !==
    VehicleMediaType.IMAGE
  ) {
    redirectVehicleError(
      vehicleId,
      "Un video no puede utilizarse como imagen principal."
    );
  }

  const orderedImages = [
    image,

    ...image.vehicle.images.filter(
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

    ...orderedImages.map(
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

  if (
    !Number.isInteger(vehicleId) ||
    vehicleId <= 0 ||
    !Number.isInteger(imageId) ||
    imageId <= 0
  ) {
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
    image.vehicleId !== vehicleId
  ) {
    redirectVehicleError(
      vehicleId,
      "No se pudo identificar el archivo."
    );
  }

  const remainingImages =
    image.vehicle.images.filter(
      (item) => item.id !== image.id
    );

  const wasMainImage =
    image.vehicle.mainImage ===
    image.url;

  const nextMainImage = wasMainImage
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

  await safelyDeleteUnreferencedFile(
    image.url
  );

  revalidateVehiclePaths(vehicleId);

  redirect(
    `/admin/inventario/${vehicleId}/editar?success=${encodeURIComponent(
      "Archivo eliminado correctamente."
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

  if (
    !Number.isInteger(vehicleId) ||
    vehicleId <= 0
  ) {
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
          orderBy: {
            order: "asc",
          },
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

  const selectedBranchIds = new Set(
    vehicle.branchAvailabilities.map(
      (item) => item.branchId
    )
  );

  selectedBranchIds.add(
    vehicle.branchId
  );

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
              id: {
                in: Array.from(
                  selectedBranchIds
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

  const publicRoute =
    vehicle.active &&
      vehicle.status ===
      VehicleStatus.DISPONIBLE &&
      vehicle.brand.active &&
      vehicle.branch.active
      ? `/vehiculos/${vehicle.id}`
      : null;

  const currentYear =
    new Date().getFullYear();

  return (
    <div className="pb-10">
      <AdminHero
        eyebrow={`Unidad #${vehicle.id}`}
        title={`${vehicle.brand.name} ${vehicle.name}`}
        description="Actualiza los datos reales, estado comercial, disponibilidad por sucursal y galería de la unidad."
        icon={Car}
        backHref="/admin/inventario"
        backLabel="Volver al inventario"
        actions={
          publicRoute ? (
            <Link
              href={publicRoute}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              <Eye size={17} />
              Ver página pública
            </Link>
          ) : undefined
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
          icon={BadgeCheck}
          label="Estado"
          value={getStatusLabel(
            vehicle.status
          )}
          tone={
            vehicle.status ===
              VehicleStatus.DISPONIBLE
              ? "emerald"
              : vehicle.status ===
                VehicleStatus.VENDIDO
                ? "red"
                : "amber"
          }
        />

        <AdminSummaryCard
          icon={Car}
          label="Condición"
          value={getConditionLabel(
            vehicle.condition
          )}
          tone="blue"
        />

        <AdminSummaryCard
          icon={CalendarDays}
          label="Año y precio"
          value={`${vehicle.year} · ${formatMoney(
            vehicle.price,
            vehicle.currency
          )}`}
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
        action={updateVehicle}
        className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]"
      >
        <input
          type="hidden"
          name="vehicleId"
          value={vehicle.id}
        />

        <div className="min-w-0 space-y-6">
          <AdminSection
            icon={Car}
            eyebrow="Información principal"
            title="Datos de la unidad"
            description="Actualiza la marca, clasificación, estado comercial, año y precio."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <AdminSelect
                label="Marca"
                name="brandId"
                required
                defaultValue={
                  vehicle.brandId
                }
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
              </AdminSelect>

              <AdminSelect
                label="Sucursal principal"
                name="branchId"
                required
                defaultValue={
                  vehicle.branchId
                }
              >
                {branches.map(
                  (branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name} ·{" "}
                      {branch.city}
                      {!branch.active
                        ? " · Inactiva"
                        : ""}
                    </option>
                  )
                )}
              </AdminSelect>

              <AdminInput
                label="Nombre de la unidad"
                name="name"
                required
                defaultValue={vehicle.name}
              />

              <AdminInput
                label="Modelo"
                name="model"
                required
                defaultValue={
                  vehicle.model
                }
              />

              <AdminSelect
                label="Categoría / tipo"
                name="category"
                defaultValue={
                  vehicle.category
                }
                description="El campo interno type se sincroniza automáticamente."
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
              </AdminSelect>

              <AdminSelect
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
              </AdminSelect>

              <AdminSelect
                label="Estado"
                name="status"
                defaultValue={
                  vehicle.status
                }
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
              </AdminSelect>

              <AdminInput
                label="Año"
                name="year"
                type="number"
                required
                min={1900}
                max={currentYear + 3}
                defaultValue={vehicle.year}
              />

              <AdminInput
                label="Precio"
                name="price"
                type="number"
                required
                min={0}
                step={1}
                defaultValue={vehicle.price}
                description={`Precio actual: ${formatMoney(
                  vehicle.price,
                  vehicle.currency
                )}`}
              />

              <AdminSelect
                label="Moneda"
                name="currency"
                defaultValue={vehicle.currency}
              >
                <option value={Currency.MXN}>
                  MXN - Peso mexicano
                </option>

                <option value={Currency.USD}>
                  USD - Dólar estadounidense
                </option>
              </AdminSelect>

              <AdminInput
                label="Kilometraje"
                name="mileage"
                type="number"
                min={0}
                step={1}
                defaultValue={
                  vehicle.mileage ?? ""
                }
                description="En unidades nuevas puede mantenerse en cero."
              />
            </div>
          </AdminSection>

          <AdminSection
            icon={Gauge}
            eyebrow="Ficha pública"
            title="Descripción y atributos"
            description="Información que se muestra en el detalle público de la unidad."
          >
            <div className="grid gap-5">
              <AdminTextarea
                label="Descripción"
                name="description"
                rows={5}
                defaultValue={
                  vehicle.description ?? ""
                }
              />

              <AdminTextarea
                label="Especificaciones rápidas"
                name="specs"
                rows={4}
                defaultValue={
                  vehicle.specs ?? ""
                }
                description="Sepáralas por comas o saltos de línea."
              />

              <AdminTextarea
                label="Características principales"
                name="features"
                rows={4}
                defaultValue={
                  vehicle.features ?? ""
                }
                description="Sepáralas por comas o saltos de línea."
              />
            </div>
          </AdminSection>

          <AdminSection
            icon={Building2}
            eyebrow="Disponibilidad"
            title="Sucursales donde aplica"
            description="La sucursal principal siempre se incluirá automáticamente."
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {branches.map((branch) => (
                <label
                  key={branch.id}
                  className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-slate-200 bg-[#f8fafb] p-4 transition hover:border-[#192a3a]/30"
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

                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-black leading-5 text-[#192a3a]">
                      {branch.name}
                    </span>

                    <span className="mt-1 block break-words text-xs font-semibold leading-5 text-slate-500">
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
          </AdminSection>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-5">
            <AdminSection
              icon={Eye}
              eyebrow="Visibilidad"
              title="Publicación"
              description="Controla la aparición de la unidad dentro del sitio."
              contentClassName="p-5"
            >
              <div className="grid gap-4">
                <div className="rounded-[16px] border border-slate-200 bg-[#f8fafb] p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <Car size={16} />
                    {getConditionLabel(
                      vehicle.condition
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm font-black text-slate-700">
                    <CalendarDays
                      size={16}
                    />
                    {vehicle.year}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm font-black text-slate-700">
                    <BadgeCheck
                      size={16}
                    />
                    {getStatusLabel(
                      vehicle.status
                    )}
                  </div>

                  <div className="mt-2 flex min-w-0 items-center gap-2 text-sm font-black text-slate-700">
                    <Gauge size={16} className="shrink-0" />

                    <span className="break-words">
                      {formatMoney(
                        vehicle.price,
                        vehicle.currency
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm font-black text-slate-700">
                    <MapPin size={16} />
                    {vehicle.branch.city}
                  </div>
                </div>

                <AdminToggleOption
                  name="active"
                  title="Visible en el sitio"
                  description="También debe tener estado disponible para mostrarse públicamente."
                  icon={
                    vehicle.active
                      ? Eye
                      : EyeOff
                  }
                  defaultChecked={
                    vehicle.active
                  }
                />

                <AdminToggleOption
                  name="isFeatured"
                  title="Unidad destacada"
                  description="Puede aparecer en carruseles y secciones principales."
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
            </AdminSection>

            <AdminSection
              icon={ImageIcon}
              eyebrow="Portada"
              title="Imagen principal"
              description="Configura la imagen representativa de la unidad."
              contentClassName="p-5"
            >
              <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-[#f8fafb]">
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
                    vehicle.mainImage ?? ""
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
                    size={25}
                    className="mx-auto text-[#192a3a]"
                  />

                  <p className="mt-3 text-center text-xs font-black text-slate-700">
                    Fotos y videos
                  </p>

                  <input
                    name="mediaFiles"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                    className="mt-4 block w-full max-w-full text-xs font-semibold text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-[#192a3a] file:px-3 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-[#29465c]" />
                </div>

                <span className="mt-2 block text-xs leading-5 text-slate-500">
                  Los archivos nuevos se agregan
                  a la galería actual.
                </span>
              </label>
            </AdminSection>

            <AdminSection
              icon={ImageIcon}
              eyebrow="Galería"
              title="Archivos actuales"
              description={`${vehicle.images.length} archivo${vehicle.images.length === 1
                ? ""
                : "s"
                } registrado${vehicle.images.length === 1
                  ? ""
                  : "s"
                }.`}
              contentClassName="p-5"
            >
              <div className="grid gap-4">
                {vehicle.images.length >
                  0 ? (
                  vehicle.images.map(
                    (image) => {
                      const isImage =
                        image.type ===
                        VehicleMediaType.IMAGE;

                      const isMain =
                        vehicle.mainImage ===
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
                                  vehicle.name
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
                                formAction={setVehicleMainImage.bind(
                                  null,
                                  vehicle.id,
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
                              formAction={deleteVehicleImage.bind(
                                null,
                                vehicle.id,
                                image.id
                              )}
                              formNoValidate
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-xs font-black text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
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
              Los videos pueden formar parte de
              la galería, pero no pueden
              utilizarse como portada principal.
            </AdminAlert>
          </div>
        </aside>
      </form>
    </div>
  );
}