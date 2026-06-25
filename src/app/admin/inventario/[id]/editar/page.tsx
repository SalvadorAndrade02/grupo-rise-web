import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ImageIcon,
  MapPin,
  Save,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { revalidatePath } from "next/cache";
import {
  VehicleCategory,
  VehicleCondition,
  VehicleStatus,
} from "@prisma/client";
import { Trash2, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deletePublicFile, saveVehicleMediaFiles } from "@/lib/uploads";

export const dynamic = "force-dynamic";

type EditVehiclePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type DbVehicleCategory = "AUTO" | "MOTO" | "TODOTERRENO";
type DbVehicleCondition = "NUEVO" | "SEMINUEVO";
type DbVehicleStatus =
  | "DISPONIBLE"
  | "APARTADO"
  | "VENDIDO"
  | "EN_TRANSITO"
  | "PROXIMAMENTE"
  | "INACTIVO";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getNumberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key));

  if (Number.isNaN(value)) {
    return 0;
  }

  return value;
}

async function updateVehicle(vehicleId: number, formData: FormData) {
  "use server";

  const currentVehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
    },
    include: {
      images: true,
    },
  });

  if (!currentVehicle) {
    notFound();
  }

  const category = getStringValue(formData, "category") as VehicleCategory;
  const condition = getStringValue(formData, "condition") as VehicleCondition;
  const status = getStringValue(formData, "status") as VehicleStatus;

  const brandId = getNumberValue(formData, "brandId");
  const branchId = getNumberValue(formData, "branchId");

  const name = getStringValue(formData, "name");
  const model = getStringValue(formData, "model");
  const version = getStringValue(formData, "version");
  const year = getNumberValue(formData, "year");
  const price = getNumberValue(formData, "price");
  const type = getStringValue(formData, "type");
  const color = getStringValue(formData, "color");
  const mileage = getNumberValue(formData, "mileage");
  const specs = getStringValue(formData, "specs");
  const features = getStringValue(formData, "features");
  const description = getStringValue(formData, "description");
  const mainImageInput = getStringValue(formData, "mainImage");

  const isFeatured = formData.get("isFeatured") === "on";
  const active = formData.get("active") === "on";

  const availabilityBranchIds = formData
    .getAll("branchIds")
    .map((value) => Number(value))
    .filter(Boolean);

  const uniqueBranchIds = Array.from(new Set([branchId, ...availabilityBranchIds]));

  const deleteMediaIds = formData
    .getAll("deleteMediaIds")
    .map((value) => Number(value))
    .filter(Boolean);

  const mediaFiles = formData
    .getAll("mediaFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const mediaToDelete = currentVehicle.images.filter((image) =>
    deleteMediaIds.includes(image.id)
  );

  const remainingMedia = currentVehicle.images.filter(
    (image) => !deleteMediaIds.includes(image.id)
  );

  if (remainingMedia.length + mediaFiles.length > 10) {
    throw new Error("El vehículo solo puede tener máximo 10 archivos entre imágenes y videos.");
  }

  const savedMedia = await saveVehicleMediaFiles(mediaFiles);

  const firstUploadedImage = savedMedia.find((item) => item.type === "IMAGE");

  const firstRemainingImage = remainingMedia.find(
    (image) => image.type === "IMAGE"
  );

  const finalMainImage =
    firstRemainingImage?.url ||
    firstUploadedImage?.url ||
    mainImageInput ||
    currentVehicle.mainImage ||
    "";

  const imagesUpdate = {
    ...(deleteMediaIds.length > 0
      ? {
        deleteMany: {
          id: {
            in: deleteMediaIds,
          },
        },
      }
      : {}),
    ...(savedMedia.length > 0
      ? {
        create: savedMedia.map((item, index) => ({
          url: item.url,
          type: item.type,
          alt: name,
          order: remainingMedia.length + index,
        })),
      }
      : {}),
  };

  await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      category,
      condition,
      status,
      brandId,
      branchId,
      name,
      model,
      version,
      year,
      price,
      type,
      color,
      mileage,
      specs,
      features,
      description,
      mainImage: finalMainImage,
      isFeatured,
      active,

      branchAvailabilities: {
        deleteMany: {},
        create: uniqueBranchIds.map((id) => ({
          branchId: id,
        })),
      },

      images: Object.keys(imagesUpdate).length > 0 ? imagesUpdate : undefined,
    },
  });

  await Promise.all(mediaToDelete.map((media) => deletePublicFile(media.url)));

  revalidatePath("/admin/inventario");
  revalidatePath(`/vehiculos/${vehicleId}`);

  redirect("/admin/inventario");
}

function formatCategory(category: string) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category] ?? category;
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { id } = await params;
  const vehicleId = Number(id);

  if (Number.isNaN(vehicleId)) {
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
        branchAvailabilities: true,
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
          city: "asc",
        },
      ],
    }),
  ]);

  if (!vehicle) {
    notFound();
  }

  const selectedBranchIds = new Set(
    vehicle.branchAvailabilities.map((item) => item.branchId)
  );

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="border-b border-[var(--rise-border)] bg-white">
        <Container className="py-6">
          <Link
            href="/admin/inventario"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[var(--rise-blue)]"
          >
            <ArrowLeft size={18} />
            Volver al inventario
          </Link>
        </Container>
      </section>

      <section className="bg-[var(--rise-navy)] py-12 text-white">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
              Administración
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Editar vehículo
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Actualiza la información de la unidad registrada en el inventario.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-8 md:py-12">
        <Container>
          <form
            action={updateVehicle.bind(null, vehicle.id)}
            className="mt-8 grid gap-5 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={vehicle.id} />

            <div className="space-y-8">
              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                    <Car size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">
                      Información principal
                    </h2>
                    <p className="text-sm text-slate-500">
                      Datos generales del auto, moto o todo terreno.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Categoría
                    </span>
                    <select
                      name="category"
                      required
                      defaultValue={vehicle.category}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    >
                      <option value="AUTO">Auto</option>
                      <option value="MOTO">Moto</option>
                      <option value="TODOTERRENO">Todo terreno</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Marca
                    </span>
                    <select
                      name="brandId"
                      required
                      defaultValue={vehicle.brandId}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    >
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name} · {formatCategory(brand.category)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Nombre comercial
                    </span>
                    <input
                      name="name"
                      required
                      defaultValue={vehicle.name}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Modelo
                    </span>
                    <input
                      name="model"
                      required
                      defaultValue={vehicle.model}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Versión
                    </span>
                    <input
                      name="version"
                      defaultValue={vehicle.version ?? ""}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Año
                    </span>
                    <input
                      name="year"
                      required
                      type="number"
                      defaultValue={vehicle.year}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Precio
                    </span>
                    <input
                      name="price"
                      required
                      type="number"
                      defaultValue={vehicle.price}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                    <CheckCircle2 size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">Características</h2>
                    <p className="text-sm text-slate-500">
                      Datos visibles en la ficha del vehículo.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Tipo / Clasificación
                    </span>
                    <input
                      name="type"
                      required
                      defaultValue={vehicle.type}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Color
                    </span>
                    <input
                      name="color"
                      defaultValue={vehicle.color ?? ""}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Kilometraje
                    </span>
                    <input
                      name="mileage"
                      type="number"
                      defaultValue={vehicle.mileage ?? ""}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Sucursal
                    </span>
                    <select
                      name="branchId"
                      required
                      defaultValue={vehicle.branchId}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    >
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} · {branch.city}
                        </option>
                      ))}
                    </select>
                    <div className="md:col-span-2">
                      <span className="mb-2 block text-sm font-bold text-slate-700">
                        Disponible también en
                      </span>

                      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                        {branches.map((branch) => (
                          <label
                            key={branch.id}
                            className="flex items-start gap-3 rounded-xl bg-white p-3"
                          >
                            <input
                              type="checkbox"
                              name="branchIds"
                              value={branch.id}
                              defaultChecked={selectedBranchIds.has(branch.id)}
                              className="mt-1 h-4 w-4"
                            />

                            <span>
                              <span className="block text-sm font-black text-slate-700">
                                {branch.name}
                              </span>
                              <span className="block text-xs font-bold text-slate-500">
                                {branch.city}, {branch.state}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        La sucursal principal se agregará automáticamente aunque no esté marcada.
                      </p>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Condición
                    </span>
                    <select
                      name="condition"
                      required
                      defaultValue={vehicle.condition}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    >
                      <option value="NUEVO">Nuevo</option>
                      <option value="SEMINUEVO">Seminuevo</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Estado
                    </span>
                    <select
                      name="status"
                      required
                      defaultValue={vehicle.status}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    >
                      <option value="DISPONIBLE">Disponible</option>
                      <option value="APARTADO">Apartado</option>
                      <option value="VENDIDO">Vendido</option>
                      <option value="EN_TRANSITO">En tránsito</option>
                      <option value="PROXIMAMENTE">Próximamente</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Especificaciones rápidas
                    </span>
                    <input
                      name="specs"
                      defaultValue={vehicle.specs}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Sepáralas por coma. Ejemplo: 689 cc, ABS, 2 cilindros.
                    </p>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Características principales
                    </span>
                    <textarea
                      name="features"
                      rows={4}
                      defaultValue={vehicle.features}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Descripción
                    </span>
                    <textarea
                      name="description"
                      rows={5}
                      defaultValue={vehicle.description}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                    <ImageIcon size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">Imagen</h2>
                    <p className="text-sm text-slate-500">
                      Imagen principal usada en el catálogo y detalle.
                    </p>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    URL de imagen principal
                  </span>
                  <input
                    name="mainImage"
                    defaultValue={vehicle.mainImage ?? ""}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                  />
                </label>

                {vehicle.mainImage && (
                  <img
                    src={vehicle.mainImage}
                    alt={vehicle.name}
                    className="mt-5 h-64 w-full rounded-3xl object-cover"
                  />
                )}
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-black">Publicación</h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Actualiza la unidad para reflejar cambios en el módulo
                  administrativo.
                </p>

                <label className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <input
                    name="isFeatured"
                    type="checkbox"
                    defaultChecked={vehicle.isFeatured}
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    Mostrar como destacado
                  </span>
                </label>

                <label className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={vehicle.active}
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    Publicación activa
                  </span>
                </label>

                <div className="md:col-span-2 rounded-[1.5rem] border border-[var(--rise-border)] bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-[var(--rise-navy)]">
                        Galería actual
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Puedes marcar archivos para eliminarlos. El vehículo puede tener máximo 10 archivos.
                      </p>
                    </div>
                  </div>

                  {vehicle.images.length > 0 ? (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {vehicle.images.map((media) => (
                        <label
                          key={media.id}
                          className="group overflow-hidden rounded-2xl border border-[var(--rise-border)] bg-slate-50"
                        >
                          <div className="relative aspect-video bg-slate-900">
                            {media.type === "VIDEO" ? (
                              <video
                                src={media.url}
                                controls
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <img
                                src={media.url}
                                alt={media.alt ?? vehicle.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-3 p-4">
                            <input
                              type="checkbox"
                              name="deleteMediaIds"
                              value={media.id}
                              className="h-4 w-4"
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
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <p className="text-sm font-bold text-slate-500">
                        Este vehículo todavía no tiene imágenes o videos.
                      </p>
                    </div>
                  )}
                </div>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Agregar nuevas imágenes o videos
                  </span>

                  <input
                    name="mediaFiles"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--rise-navy)] file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-[var(--rise-blue)] focus:border-[var(--rise-blue)] focus:bg-white"
                  />

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Máximo 10 archivos por vehículo. Puedes subir JPG, PNG, WEBP, AVIF, MP4, WEBM o MOV.
                  </p>
                </label>

                <button
                  type="submit"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                >
                  <Save size={18} />
                  Guardar cambios
                </button>

                <Link
                  href="/admin/inventario"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[var(--rise-border)] px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
                >
                  Cancelar
                </Link>

                <div className="mt-6 rounded-2xl bg-[var(--rise-blue-soft)] p-4">
                  <div className="flex gap-3">
                    <MapPin
                      size={20}
                      className="shrink-0 text-[var(--rise-blue)]"
                    />
                    <p className="text-xs leading-5 text-slate-600">
                      Al desactivar la publicación, el vehículo puede seguir en
                      base de datos pero ocultarse del sitio público más
                      adelante.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </form>
        </Container>
      </section>

      <Footer />
    </main>
  );
}