import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Car,
  Eye,
  EyeOff,
  ImageIcon,
  Save,
  Star,
  Trash2,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleCondition,
  VehicleMediaType,
  VehicleStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deletePublicFile, saveVehicleMediaFiles } from "@/lib/uploads";

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

function parseCategory(
  value: FormDataEntryValue | null,
  fallback: VehicleCategory
): VehicleCategory {
  return validCategories.includes(value as VehicleCategory)
    ? (value as VehicleCategory)
    : fallback;
}

function parseCondition(
  value: FormDataEntryValue | null,
  fallback: VehicleCondition
): VehicleCondition {
  return validConditions.includes(value as VehicleCondition)
    ? (value as VehicleCondition)
    : fallback;
}

function parseStatus(
  value: FormDataEntryValue | null,
  fallback: VehicleStatus
): VehicleStatus {
  return validStatuses.includes(value as VehicleStatus)
    ? (value as VehicleStatus)
    : fallback;
}

function getCategoryLabel(category: VehicleCategory) {
  const labels: Record<VehicleCategory, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category];
}

function getConditionLabel(condition: VehicleCondition) {
  const labels: Record<VehicleCondition, string> = {
    NUEVO: "Nuevo",
    SEMINUEVO: "Seminuevo",
  };

  return labels[condition];
}

function getStatusLabel(status: VehicleStatus) {
  const labels: Record<VehicleStatus, string> = {
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

async function updateVehicle(formData: FormData) {
  "use server";

  const vehicleId = Number(formData.get("vehicleId"));

  if (!vehicleId) {
    redirect("/admin/inventario?error=Vehículo no válido");
  }

  const currentVehicle = await prisma.vehicle.findUnique({
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
    redirect("/admin/inventario?error=El vehículo ya no existe");
  }

  const brandId = Number(formData.get("brandId"));
  const branchId = Number(formData.get("branchId"));

  const name = getStringValue(formData, "name");
  const model = getStringValue(formData, "model") || name;

  const category = parseCategory(
    formData.get("category"),
    currentVehicle.category
  );

  const type = category;

  const condition = parseCondition(
    formData.get("condition"),
    currentVehicle.condition
  );

  const status = parseStatus(formData.get("status"), currentVehicle.status);

  const year = getOptionalNumberValue(formData, "year") ?? currentVehicle.year;
  const price =
    getOptionalNumberValue(formData, "price") ?? currentVehicle.price;

  const mileage = getOptionalNumberValue(formData, "mileage");

  const description = getStringValue(formData, "description");
  const specs = getStringValue(formData, "specs");
  const features = getStringValue(formData, "features");

  const mainImageUrl = getStringValue(formData, "mainImageUrl");

  const active = formData.get("active") === "on";
  const isFeatured = formData.get("isFeatured") === "on";

  if (!brandId || !branchId || !name || !model) {
    redirect(
      `/admin/inventario/${vehicleId}/editar?error=${encodeURIComponent(
        "Selecciona marca, sucursal y captura el nombre de la unidad."
      )}`
    );
  }

  if (!Number.isFinite(year) || year < 1900) {
    redirect(
      `/admin/inventario/${vehicleId}/editar?error=${encodeURIComponent(
        "El año del vehículo no es válido."
      )}`
    );
  }

  if (!Number.isFinite(price) || price < 0) {
    redirect(
      `/admin/inventario/${vehicleId}/editar?error=${encodeURIComponent(
        "El precio del vehículo no es válido."
      )}`
    );
  }

  const selectedBranchIds = formData
    .getAll("branchIds")
    .map((value) => Number(value))
    .filter(Boolean);

  const uniqueBranchIds = Array.from(
    new Set([branchId, ...selectedBranchIds].filter(Boolean))
  );

  const mediaFiles = formData
    .getAll("mediaFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  let savedMedia: Awaited<ReturnType<typeof saveVehicleMediaFiles>> = [];

  try {
    savedMedia = await saveVehicleMediaFiles(mediaFiles);
  } catch (error) {
    console.error(error);

    redirect(
      `/admin/inventario/${vehicleId}/editar?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los archivos del vehículo."
      )}`
    );
  }

  const currentHighestOrder = currentVehicle.images.reduce((highest, image) => {
    return image.order > highest ? image.order : highest;
  }, -1);

  const firstUploadedImage = savedMedia.find(
    (item) => item.type === VehicleMediaType.IMAGE
  );

  const firstExistingImage = currentVehicle.images.find(
    (item) => item.type === VehicleMediaType.IMAGE
  );

  const finalMainImage =
    mainImageUrl ||
    currentVehicle.mainImage ||
    firstExistingImage?.url ||
    firstUploadedImage?.url ||
    "";

  await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      brandId,
      branchId,
      name,
      model,
      type,
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

      branchAvailabilities: {
        deleteMany: {},
        create: uniqueBranchIds.map((branchId) => ({
          branchId,
        })),
      },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/inventario/salud");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(`/vehiculos/${vehicleId}`);

  redirect(
    `/admin/inventario/${vehicleId}/editar?success=${encodeURIComponent(
      "Vehículo actualizado correctamente."
    )}`
  );
}

async function setVehicleMainImage(vehicleId: number, imageId: number) {
  "use server";

  if (!vehicleId || !imageId) {
    return;
  }

  const image = await prisma.vehicleImage.findUnique({
    where: {
      id: imageId,
    },
  });

  if (!image || image.vehicleId !== vehicleId) {
    redirect(
      `/admin/inventario/${vehicleId}/editar?error=${encodeURIComponent(
        "No se pudo identificar la imagen."
      )}`
    );
  }

  await prisma.$transaction([
    prisma.vehicle.update({
      where: {
        id: vehicleId,
      },
      data: {
        mainImage: image.url,
      },
    }),

    prisma.vehicleImage.updateMany({
      where: {
        vehicleId,
      },
      data: {
        order: 1,
      },
    }),

    prisma.vehicleImage.update({
      where: {
        id: imageId,
      },
      data: {
        order: 0,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/inventario/salud");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(`/vehiculos/${vehicleId}`);

  redirect(
    `/admin/inventario/${vehicleId}/editar?success=${encodeURIComponent(
      "Imagen principal actualizada."
    )}`
  );
}

async function deleteVehicleImage(vehicleId: number, imageId: number) {
  "use server";

  if (!vehicleId || !imageId) {
    return;
  }

  const image = await prisma.vehicleImage.findUnique({
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

  if (!image || image.vehicleId !== vehicleId) {
    redirect(
      `/admin/inventario/${vehicleId}/editar?error=${encodeURIComponent(
        "No se pudo identificar la imagen."
      )}`
    );
  }

  const remainingImages = image.vehicle.images.filter(
    (item) => item.id !== image.id
  );

  await prisma.vehicleImage.delete({
    where: {
      id: imageId,
    },
  });

  if (image.vehicle.mainImage === image.url) {
    const nextMainImage =
      remainingImages.find((item) => item.type === VehicleMediaType.IMAGE)
        ?.url ?? "";

    await prisma.vehicle.update({
      where: {
        id: vehicleId,
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
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/inventario/salud");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(`/vehiculos/${vehicleId}`);

  redirect(
    `/admin/inventario/${vehicleId}/editar?success=${encodeURIComponent(
      "Imagen eliminada correctamente."
    )}`
  );
}

export default async function EditVehiclePage({
  params,
  searchParams,
}: EditVehiclePageProps) {
  const { id } = await params;
  const query = await searchParams;

  const vehicleId = Number(id);

  if (!vehicleId) {
    notFound();
  }

  const [vehicle, brands, branches] = await Promise.all([
    prisma.vehicle.findUnique({
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
    }),

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
  ]);

  if (!vehicle) {
    notFound();
  }

  const mainImage =
    vehicle.mainImage ||
    vehicle.images.find((image) => image.type === VehicleMediaType.IMAGE)?.url ||
    "";

  const selectedBranchIds = new Set(
    vehicle.branchAvailabilities.map((item) => item.branchId)
  );

  selectedBranchIds.add(vehicle.branchId);

  const publicRoute =
    vehicle.status === VehicleStatus.DISPONIBLE && vehicle.active
      ? `/vehiculos/${vehicle.id}`
      : null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <Link
            href="/admin/inventario"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[var(--rise-blue)]"
          >
            <ArrowLeft size={18} />
            Volver al inventario
          </Link>

          <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
            Editar unidad real
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            {vehicle.brand.name} {vehicle.name}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Actualiza datos reales de la unidad, estado comercial, sucursales y
            galería. Si agregas nuevas imágenes, se suman a las actuales.
          </p>
        </div>

        {publicRoute && (
          <Link
            href={publicRoute}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
          >
            <Eye size={18} />
            Ver público
          </Link>
        )}
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

      <form
        action={updateVehicle}
        className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"
      >
        <input type="hidden" name="vehicleId" value={vehicle.id} />

        <div className="grid gap-6">
          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Información principal
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Datos de la unidad
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Marca
                </span>

                <select
                  name="brandId"
                  defaultValue={vehicle.brandId}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Sucursal principal
                </span>

                <select
                  name="branchId"
                  defaultValue={vehicle.branchId}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Nombre de la unidad
                </span>

                <input
                  name="name"
                  required
                  defaultValue={vehicle.name}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Modelo
                </span>

                <input
                  name="model"
                  required
                  defaultValue={vehicle.model}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Categoría / Tipo
                </span>

                <select
                  name="category"
                  defaultValue={vehicle.category}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  {validCategories.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  El campo interno type se sincroniza automáticamente con esta
                  categoría.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Condición
                </span>

                <select
                  name="condition"
                  defaultValue={vehicle.condition}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  {validConditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {getConditionLabel(condition)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Estado
                </span>

                <select
                  name="status"
                  defaultValue={vehicle.status}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  {validStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Año
                </span>

                <input
                  name="year"
                  type="number"
                  required
                  defaultValue={vehicle.year}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Precio
                </span>

                <input
                  name="price"
                  type="number"
                  required
                  defaultValue={vehicle.price}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />

                <p className="mt-2 text-xs font-bold text-slate-500">
                  Actual: {formatMoney(vehicle.price)}
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Kilometraje
                </span>

                <input
                  name="mileage"
                  type="number"
                  defaultValue={vehicle.mileage ?? ""}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Ficha pública
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Descripción y atributos
            </h2>

            <div className="mt-6 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Descripción
                </span>

                <textarea
                  name="description"
                  rows={5}
                  defaultValue={vehicle.description ?? ""}
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
                  defaultValue={vehicle.specs ?? ""}
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
                  defaultValue={vehicle.features ?? ""}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-3">
              <Building2 size={22} className="text-[var(--rise-blue)]" />

              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Disponibilidad
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Sucursales donde aplica
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {branches.map((branch) => (
                <label
                  key={branch.id}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <input
                    type="checkbox"
                    name="branchIds"
                    value={branch.id}
                    defaultChecked={selectedBranchIds.has(branch.id)}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-black text-slate-700">
                      {branch.name}
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      {branch.city}, {branch.state}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid gap-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/5 md:p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Publicación
            </p>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <Car size={17} />
                  {getConditionLabel(vehicle.condition)}
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm font-black text-slate-700">
                  <CalendarDays size={17} />
                  {vehicle.year}
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm font-black text-slate-700">
                  <BadgeCheck size={17} />
                  {getStatusLabel(vehicle.status)}
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={vehicle.active}
                  className="mt-1 h-5 w-5 rounded border-slate-300"
                />

                <span>
                  <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                    {vehicle.active ? <Eye size={16} /> : <EyeOff size={16} />}
                    Visible en el sitio
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Para aparecer públicamente también debe estar disponible.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  name="isFeatured"
                  defaultChecked={vehicle.isFeatured}
                  className="mt-1 h-5 w-5 rounded border-slate-300"
                />

                <span>
                  <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <Star size={16} />
                    Destacado
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Puede aparecer en secciones destacadas del sitio.
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
                  alt={vehicle.name}
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
                defaultValue={vehicle.mainImage ?? ""}
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

              <ImageIcon size={22} className="text-slate-400" />
            </div>

            <div className="mt-5 grid gap-4">
              {vehicle.images.length > 0 ? (
                vehicle.images.map((image) => {
                  const isMain = vehicle.mainImage === image.url;

                  return (
                    <article
                      key={image.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                    >
                      <div className="relative">
                        {image.type === VehicleMediaType.IMAGE ? (
                          <img
                            src={image.url}
                            alt={image.alt ?? vehicle.name}
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
                          formAction={setVehicleMainImage.bind(null, vehicle.id, image.id)}
                          formNoValidate
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                        >
                          <Star size={15} />
                          Usar como principal
                        </button>

                        <button
                          type="submit"
                          formAction={deleteVehicleImage.bind(null, vehicle.id, image.id)}
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
                    Esta unidad no tiene galería.
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