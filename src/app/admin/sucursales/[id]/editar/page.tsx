import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  Store,
  Tags,
  Users,
} from "lucide-react";
import { VehicleCondition, VehicleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  deleteBranchImageFile,
  saveBranchImageFile,
} from "@/lib/branch-uploads";

export const dynamic = "force-dynamic";

type EditBranchPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getTextValue(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function getOptionalTextValue(formData: FormData, fieldName: string) {
  const value = getTextValue(formData, fieldName);

  return value || null;
}

function getNumberValue(formData: FormData, fieldName: string) {
  const value = Number(formData.get(fieldName));

  return Number.isFinite(value) ? value : 0;
}

function cleanPhone(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function getWhatsAppHref(phone?: string | null, message?: string) {
  const phoneNumber = cleanPhone(phone);

  if (!phoneNumber) {
    return "";
  }

  const finalPhone = phoneNumber.startsWith("52")
    ? phoneNumber
    : `52${phoneNumber}`;

  const text = message ? `?text=${encodeURIComponent(message)}` : "";

  return `https://wa.me/${finalPhone}${text}`;
}

function splitServices(value?: string | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getBranchLocationText(branch: {
  address: string;
  city: string;
  state: string;
}) {
  return `${branch.address}, ${branch.city}, ${branch.state}`;
}

function getMapExternalUrl(branch: {
  address: string;
  city: string;
  state: string;
  googleMapsUrl?: string | null;
}) {
  if (branch.googleMapsUrl?.trim()) {
    return branch.googleMapsUrl;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    getBranchLocationText(branch)
  )}`;
}

async function updateBranch(branchId: number, formData: FormData) {
  "use server";

  if (!branchId) {
    redirect("/admin/sucursales");
  }

  const name = getTextValue(formData, "name");
  const city = getTextValue(formData, "city");
  const state = getTextValue(formData, "state");
  const address = getTextValue(formData, "address");

  if (!name || !city || !state || !address) {
    redirect(
      `/admin/sucursales/${branchId}/editar?error=${encodeURIComponent(
        "Nombre, ciudad, estado y dirección son obligatorios."
      )}`
    );
  }

  const currentBranch = await prisma.branch.findUnique({
    where: {
      id: branchId,
    },
    select: {
      logoUrl: true,
      coverImageUrl: true,
    },
  });

  if (!currentBranch) {
    redirect("/admin/sucursales");
  }

  let uploadedLogoUrl: string | null = null;
  let uploadedCoverImageUrl: string | null = null;

  try {
    uploadedLogoUrl = await saveBranchImageFile(
      formData.get("logoFile"),
      "logos"
    );

    uploadedCoverImageUrl = await saveBranchImageFile(
      formData.get("coverImageFile"),
      "fachadas"
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo guardar la imagen.";

    redirect(
      `/admin/sucursales/${branchId}/editar?error=${encodeURIComponent(message)}`
    );
  }

  const finalLogoUrl =
    uploadedLogoUrl ??
    getOptionalTextValue(formData, "logoUrl") ??
    currentBranch.logoUrl;

  const finalCoverImageUrl =
    uploadedCoverImageUrl ??
    getOptionalTextValue(formData, "coverImageUrl") ??
    currentBranch.coverImageUrl;

  await prisma.branch.update({
    where: {
      id: branchId,
    },
    data: {
      name,
      city,
      state,
      address,
      phone: getOptionalTextValue(formData, "phone"),
      whatsapp: getOptionalTextValue(formData, "whatsapp"),
      email: getOptionalTextValue(formData, "email"),
      schedule: getOptionalTextValue(formData, "schedule"),
      googleMapsUrl: getOptionalTextValue(formData, "googleMapsUrl"),
      services: getOptionalTextValue(formData, "services"),
      logoUrl: finalLogoUrl,
      coverImageUrl: finalCoverImageUrl,
      sortOrder: getNumberValue(formData, "sortOrder"),
      active: formData.get("active") === "on",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/sucursales");
  revalidatePath(`/admin/sucursales/${branchId}/editar`);
  revalidatePath("/sucursales");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");

  redirect(
    `/admin/sucursales?success=${encodeURIComponent(
      "Sucursal actualizada correctamente."
    )}`
  );
}

export default async function EditBranchPage({ params }: EditBranchPageProps) {
  const { id } = await params;
  const branchId = Number(id);

  if (!branchId) {
    notFound();
  }

  const branch = await prisma.branch.findUnique({
    where: {
      id: branchId,
    },
    include: {
      vehicles: {
        where: {
          active: true,
          status: VehicleStatus.DISPONIBLE,
          brand: {
            active: true,
          },
        },
        select: {
          id: true,
          condition: true,
        },
      },
      leads: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!branch) {
    notFound();
  }

  const services = splitServices(branch.services);

  const newVehicles = branch.vehicles.filter(
    (vehicle) => vehicle.condition === VehicleCondition.NUEVO
  ).length;

  const usedVehicles = branch.vehicles.filter(
    (vehicle) => vehicle.condition === VehicleCondition.SEMINUEVO
  ).length;

  const whatsappHref = getWhatsAppHref(
    branch.whatsapp,
    `Hola, me gustaría recibir información de ${branch.name}.`
  );

  const mapUrl = getMapExternalUrl(branch);

  return (
    <section className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <Link
            href="/admin/sucursales"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[var(--rise-blue)]"
          >
            <ArrowLeft size={18} />
            Volver a sucursales
          </Link>

          <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
            Administración
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Editar sucursal
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            Actualiza datos de contacto, ubicación, horario, servicios, mapa,
            orden y estado público de la sucursal.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/sucursales"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
          >
            Ver público
            <ExternalLink size={17} />
          </Link>

          <Link
            href="/admin/sucursales"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
          >
            Sucursales
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Store className="text-[var(--rise-blue)]" />
          <p className="mt-4 text-sm font-bold text-slate-500">Estado</p>
          <p className="mt-1 text-2xl font-black">
            {branch.active ? "Activa" : "Inactiva"}
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Tags className="text-[var(--rise-blue)]" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            Vehículos nuevos
          </p>
          <p className="mt-1 text-3xl font-black">{newVehicles}</p>
        </div>

        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Tags className="text-amber-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">Seminuevos</p>
          <p className="mt-1 text-3xl font-black">{usedVehicles}</p>
        </div>

        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Users className="text-purple-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">Leads</p>
          <p className="mt-1 text-3xl font-black">{branch.leads.length}</p>
        </div>
      </div>

      <form
        action={updateBranch.bind(null, branch.id)}
        className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
      >
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                <Building2 size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  Información principal
                </h2>

                <p className="text-sm text-slate-500">
                  Datos generales de la agencia.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Nombre de agencia *
                </span>

                <input
                  name="name"
                  required
                  defaultValue={branch.name}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Ciudad *
                </span>

                <input
                  name="city"
                  required
                  defaultValue={branch.city}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Estado *
                </span>

                <input
                  name="state"
                  required
                  defaultValue={branch.state}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Dirección *
                </span>

                <textarea
                  name="address"
                  required
                  rows={3}
                  defaultValue={branch.address}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Logo de sucursal
              </span>

              {branch.logoUrl && (
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white p-2">
                    <img
                      src={branch.logoUrl}
                      alt={`Logo ${branch.name}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[var(--rise-navy)]">
                      Logo actual
                    </p>
                    <p className="text-xs text-slate-500">
                      Sube un nuevo archivo para reemplazarlo.
                    </p>
                  </div>
                </div>
              )}

              <input type="hidden" name="logoUrl" defaultValue={branch.logoUrl ?? ""} />

              <input
                name="logoFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--rise-navy)] file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:bg-white focus:border-[var(--rise-blue)]"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Formatos permitidos: JPG, PNG, WEBP o AVIF. Máximo 6 MB.
              </p>
            </label>
          </section>

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                <Phone size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black">Contacto</h2>

                <p className="text-sm text-slate-500">
                  Información visible para clientes.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Teléfono
                </span>

                <input
                  name="phone"
                  defaultValue={branch.phone ?? ""}
                  placeholder="81 1099 4545"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  WhatsApp
                </span>

                <input
                  name="whatsapp"
                  defaultValue={branch.whatsapp ?? ""}
                  placeholder="81 1099 4545"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Correo
                </span>

                <input
                  name="email"
                  type="email"
                  defaultValue={branch.email ?? ""}
                  placeholder="contacto@gruporise.com"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Horario
                </span>

                <input
                  name="schedule"
                  defaultValue={branch.schedule ?? ""}
                  placeholder="Lunes a viernes 9:00 a 19:00, sábado 9:00 a 14:00"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                <MapPin size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black">Mapa y servicios</h2>

                <p className="text-sm text-slate-500">
                  Ubicación y etiquetas públicas de la sucursal.
                </p>
              </div>
            </div>

            <div className="grid gap-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Google Maps URL
                </span>

                <input
                  name="googleMapsUrl"
                  defaultValue={branch.googleMapsUrl ?? ""}
                  placeholder="https://maps.google.com/..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Puede ser una URL normal de Google Maps. Si está vacío, el
                  sistema intentará generar el mapa usando la dirección.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Foto de fachada / agencia
                </span>

                {branch.coverImageUrl && (
                  <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img
                      src={branch.coverImageUrl}
                      alt={`Fachada de ${branch.name}`}
                      className="h-48 w-full object-cover"
                    />

                    <div className="p-3">
                      <p className="text-sm font-black text-[var(--rise-navy)]">
                        Fachada actual
                      </p>
                      <p className="text-xs text-slate-500">
                        Sube una nueva imagen para reemplazarla.
                      </p>
                    </div>
                  </div>
                )}

                <input
                  type="hidden"
                  name="coverImageUrl"
                  defaultValue={branch.coverImageUrl ?? ""}
                />

                <input
                  name="coverImageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--rise-navy)] file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:bg-white focus:border-[var(--rise-blue)]"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Recomendado: imagen horizontal de la fachada o agencia.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Servicios
                </span>

                <textarea
                  name="services"
                  rows={4}
                  defaultValue={branch.services ?? ""}
                  placeholder="Ventas, Servicio, Refacciones, Motos, Todo terreno"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Sepáralos por coma.
                </p>
              </label>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-xl shadow-slate-900/5">
            <h2 className="text-xl font-black">Publicación</h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Controla si la sucursal aparece en público y el orden de
              visualización.
            </p>

            <label className="mt-6 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Orden
              </span>

              <input
                name="sortOrder"
                type="number"
                defaultValue={branch.sortOrder}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              />
            </label>

            <label className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <input
                name="active"
                type="checkbox"
                defaultChecked={branch.active}
                className="h-5 w-5 rounded border-slate-300"
              />

              <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                {branch.active ? <Eye size={17} /> : <EyeOff size={17} />}
                Sucursal activa
              </span>
            </label>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
            >
              <Save size={18} />
              Guardar cambios
            </button>

            <Link
              href="/admin/sucursales"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[var(--rise-border)] px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
            >
              Cancelar
            </Link>

            <div className="mt-6 grid gap-3">
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                <MapPin size={17} />
                Ver mapa
              </a>

              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                >
                  <MessageCircle size={17} />
                  Probar WhatsApp
                </a>
              )}
            </div>

            {services.length > 0 && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Servicios actuales
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {services.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
                    >
                      <CheckCircle2 size={13} />
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-[var(--rise-blue-soft)] p-4">
              <p className="text-xs leading-5 text-slate-600">
                Las sucursales inactivas se ocultan en la página pública y
                también pueden afectar la visibilidad pública de sus vehículos.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </section>
  );
}